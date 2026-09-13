import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidPincode,
  assertValidPincode,
  checkPincodeServiceability,
} from '../services/shipping/pincode.service.js';
import {
  totalDeadWeight,
  calculateVolumetricWeight,
  roundChargeableWeight,
  roundUpToSlab,
  calculateChargeableWeight,
} from '../services/shipping/weight.service.js';
import { calculatePackageDimensions } from '../services/shipping/package.service.js';
import {
  getBaseRate,
  calculateCodCharge,
  calculateRemoteSurcharge,
  calculateExpressSurcharge,
  calculateTax,
  computeAdditionalCharges,
  applyDeliveryProportionalCap,
} from '../services/shipping/rate.service.js';
import { determineZone } from '../services/shipping/zone.service.js';
import { calculateShippingSchema } from '../validators/shipping.validator.js';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const BASE_CONFIG = {
  volumetricDivisor: 5000,
  weightRoundingRule: 'ceilToSlab',
  weightSlabSize: 0.5,
  codFixedCharge: 30,
  codPercentage: 0.02,
  remoteSurcharge: 40,
  expressSurcharge: 25,
  taxRate: 0.18,
  insuranceEnabled: false,
  insuranceRate: 0,
  packagingAllowance: 0,
  defaultZone: 'REST_OF_INDIA',
};

// Normalize base config against DEFAULT_SHIPPING_CONFIG so real defaults remain.
const parseBody = (body) => calculateShippingSchema.safeParse({ body }).success;

// 1 + 2. PIN validation ───────────────────────────────────────────────────

describe('PIN validation', () => {
  it('rejects invalid PIN formats (too short, non-numeric, starts with 0)', () => {
    assert.equal(isValidPincode('12345'), false);
    assert.equal(isValidPincode('1234567'), false);
    assert.equal(isValidPincode('012345'), false);
    assert.equal(isValidPincode('abcd ef'), false);
    assert.equal(isValidPincode(null), false);
    assert.equal(isValidPincode(undefined), false);
  });

  it('accepts a valid 6-digit Indian PIN', () => {
    assert.equal(isValidPincode('788001'), true);
    assert.equal(isValidPincode('110001'), true);
  });

  it('assertValidPincode throws for an invalid PIN and returns value for a valid one', () => {
    assert.throws(() => assertValidPincode('12345'), /INVALID_PINCODE/);
    assert.equal(assertValidPincode(' 110001 '), '110001');
  });
});

// 3 + 4. Serviceability / COD ─────────────────────────────────────────────

describe('Serviceability', () => {
  const metaFor = (overrides) => async () => ({
    pincode: '123456',
    serviceable: true,
    codAvailable: true,
    zone: 'REST_OF_INDIA',
    ...overrides,
  });

  it('flags a non-serviceable destination with a stable error code', async () => {
    const result = await checkPincodeServiceability(
      '785001',
      '110001',
      { paymentMethod: 'PREPAID' },
      { getMetadata: metaFor({ serviceable: false }) },
    );
    assert.equal(result.success, false);
    assert.equal(result.error, 'DESTINATION_NOT_SERVICEABLE');
  });

  it('rejects COD when unavailable at destination', async () => {
    const result = await checkPincodeServiceability(
      '785001',
      '110001',
      { paymentMethod: 'COD' },
      { getMetadata: metaFor({ codAvailable: false }) },
    );
    assert.equal(result.success, false);
    assert.equal(result.error, 'COD_NOT_AVAILABLE');
  });

  it('accepts COD when available at destination', async () => {
    const result = await checkPincodeServiceability(
      '785001',
      '110001',
      { paymentMethod: 'COD' },
      { getMetadata: metaFor({ codAvailable: true }) },
    );
    assert.equal(result.success, true);
    assert.equal(result.codAvailable, true);
  });
});

// 5 + 6 + 7. Request validation ───────────────────────────────────────────

describe('Request validation', () => {
  const base = {
    destinationPincode: '110001',
    items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
    paymentMethod: 'PREPAID',
    shippingMode: 'SURFACE',
    orderValue: 100,
  };

  it('rejects zero quantity (5)', () => {
    assert.equal(parseBody({ ...base, items: [{ productId: base.items[0].productId, quantity: 0 }] }), false);
  });

  it('rejects negative quantity (6)', () => {
    assert.equal(parseBody({ ...base, items: [{ productId: base.items[0].productId, quantity: -1 }] }), false);
  });

  it('rejects items missing a productId (7 - missing product)', () => {
    assert.equal(parseBody({ ...base, items: [{ quantity: 1 }] }), false);
  });

  it('accepts a well-formed request', () => {
    assert.equal(parseBody(base), true);
  });
});

// 8 + 9 + 10 + 11. Weight calculations ────────────────────────────────────

describe('Weight calculations', () => {
  it('sums multiple products (8)', () => {
    const res = totalDeadWeight([
      { weight: 0.5, quantity: 1 },
      { weight: 1.0, quantity: 1 },
    ]);
    assert.equal(res, 1.5);
  });

  it('multiplies weight by quantity (9)', () => {
    const res = totalDeadWeight([{ weight: 0.45, quantity: 2 }]);
    assert.equal(res, 0.9);
  });

  it('prefers packaged weight over raw product weight', () => {
    const res = totalDeadWeight([{ weight: 0.3, packagedWeight: 0.5, quantity: 1 }]);
    assert.equal(res, 0.5);
  });

  it('uses dead weight when it is the greater (10)', async () => {
    const { raw } = await calculateChargeableWeight(1.2, 0.8, BASE_CONFIG);
    assert.equal(raw, 1.2);
  });

  it('uses volumetric weight when it is the greater (11)', async () => {
    const { raw } = await calculateChargeableWeight(0.5, 2.0, BASE_CONFIG);
    assert.equal(raw, 2.0);
  });

  it('computes volumetric weight with a configurable divisor', () => {
    const dims = { length: 50, width: 40, height: 25 };
    assert.equal(calculateVolumetricWeight(dims, 5000), 10);
    assert.equal(calculateVolumetricWeight(dims, 10000), 5);
  });
});

// 12 + 13. Slab boundary rounding ─────────────────────────────────────────

describe('Chargeable-weight rounding', () => {
  it('rounds a weight exactly on a slab boundary unchanged (12)', () => {
    assert.equal(roundUpToSlab(0.5, 0.5), 0.5);
    assert.equal(roundUpToSlab(1.0, 0.5), 1.0);
  });

  it('rounds a weight slightly above a slab boundary up (13)', () => {
    assert.equal(roundChargeableWeight(0.42, { weightSlabSize: 0.5, weightRoundingRule: 'ceilToSlab' }), 0.5);
    assert.equal(roundChargeableWeight(0.73, { weightSlabSize: 0.5, weightRoundingRule: 'ceilToSlab' }), 1.0);
    assert.equal(roundChargeableWeight(1.15, { weightSlabSize: 0.5, weightRoundingRule: 'ceilToSlab' }), 1.5);
  });

  it('supports a non-ceil rounding rule', () => {
    const res = roundChargeableWeight(0.26, { weightSlabSize: 0.5, weightRoundingRule: 'roundToSlab' });
    assert.equal(res, 0.5);
    const res2 = roundChargeableWeight(0.24, { weightSlabSize: 0.5, weightRoundingRule: 'roundToSlab' });
    assert.equal(res2, 0);
  });
});

// 14 + 15 + 16 + 17. Surcharges ───────────────────────────────────────────

describe('Additional charges', () => {
  it('applies remote-area surcharge only for REMOTE zone (14)', async () => {
    assert.equal(await calculateRemoteSurcharge('REMOTE', BASE_CONFIG), 40);
    assert.equal(await calculateRemoteSurcharge('REST_OF_INDIA', BASE_CONFIG), 0);
  });

  it('computes COD charge as max(fixed, percentage) (15)', async () => {
    const conf = { ...BASE_CONFIG, codFixedCharge: 30, codPercentage: 0.02 };
    assert.equal(await calculateCodCharge(1499, conf), 30); // max(30, 29.98) = 30
    assert.equal(await calculateCodCharge(5000, conf), 100); // 5000 * 0.02 = 100
  });

  it('applies no COD charge for a prepaid order (16)', async () => {
    const charges = await computeAdditionalCharges({
      paymentMethod: 'PREPAID',
      orderValue: 1499,
      zone: 'REST_OF_INDIA',
      shippingMode: 'SURFACE',
      baseShippingCharge: 80,
      config: BASE_CONFIG,
    });
    assert.equal(charges.codCharge, 0);
  });

  it('applies express surcharge for EXPRESS mode (17)', async () => {
    assert.equal(await calculateExpressSurcharge('EXPRESS', BASE_CONFIG), 25);
    assert.equal(await calculateExpressSurcharge('SURFACE', BASE_CONFIG), 0);
  });

  it('computes tax on the pre-tax subtotal', () => {
    assert.equal(calculateTax(100, 0.18), 18);
  });
});

// 18 + 19. Package dimensions ─────────────────────────────────────────────

describe('Package dimensions', () => {
  it('returns defaults when all dimensions are missing (18)', async () => {
    const dims = await calculatePackageDimensions([{ quantity: 1 }], { allowance: 0 });
    assert.equal(dims.length > 0, true);
    assert.equal(dims.width > 0, true);
    assert.equal(dims.height > 0, true);
  });

  it('combines dimensions for multiple items (19)', async () => {
    const dims = await calculatePackageDimensions(
      [
        { dimensions: { length: 20, width: 10, height: 5 }, quantity: 1 },
        { dimensions: { length: 20, width: 10, height: 5 }, quantity: 1 },
      ],
      { allowance: 0 },
    );
    // Two identical boxes side by side double the length, keep width/height.
    assert.equal(dims.length, 40);
    assert.equal(dims.width, 10);
    assert.equal(dims.height, 5);
  });

  it('uses packaged dimensions when present', async () => {
    const dims = await calculatePackageDimensions(
      [{ dimensions: { length: 20, width: 10, height: 5 }, packagedDimensions: { length: 30, width: 22, height: 10 }, quantity: 1 }],
      { allowance: 0 },
    );
    assert.equal(dims.length, 30);
  });
});

// 20 + 21. Rate lookup and zone resolution ────────────────────────────────

describe('Rate lookup and zone', () => {
  const fakeRates = [
    { weightFrom: 0, weightTo: 0.5, baseRate: 55 },
    { weightFrom: 0.5, weightTo: 1.0, baseRate: 70 },
    { weightFrom: 1.0, weightTo: 100000, baseRate: 85 },
  ];

  it('looks up the correct slab for a chargeable weight', async () => {
    const res = await getBaseRate(
      { carrier: 'INTERNAL', mode: 'SURFACE', zone: 'REGIONAL', chargeableWeight: 0.9 },
      { getRates: async () => fakeRates },
    );
    assert.equal(res.base, 70);
  });

  it('throws a stable error when no rate card exists (20)', async () => {
    await assert.rejects(
      getBaseRate(
        { carrier: 'INTERNAL', mode: 'SURFACE', zone: 'REGIONAL', chargeableWeight: 0.5 },
        { getRates: async () => [] },
      ),
      /RATE_CARD_NOT_FOUND/,
    );
  });

  it('returns the default zone when no PIN/rule maps to one (21)', async () => {
    const zone = await determineZone(
      '785001',
      '110001',
      { getPincodeMetadata: async () => null, getConfig: async () => BASE_CONFIG, getZoneRules: async () => [] },
    );
    assert.equal(zone.zone, 'REST_OF_INDIA');
    assert.equal(zone.source, 'default');
  });

  it('returns LOCAL for the same origin/destination PIN', async () => {
    const zone = await determineZone('110001', '110001', {});
    assert.equal(zone.zone, 'LOCAL');
  });
});

// 22. Missing product shipping data ───────────────────────────────────────
describe('Missing shipping data (22)', () => {
  it('falls back to default weight for a product with no shipping details', () => {
    assert.equal(totalDeadWeight([{ quantity: 1 }]), 0);
  });

  it('falls back gracefully for empty dimensions in package calc', async () => {
    const dims = await calculatePackageDimensions([{}], { allowance: 0 });
    assert.ok(dims.length > 0);
  });
});

// 23. Delivery charge proportionality (low-priced items) ───────────────────
describe('Delivery charge proportionality', () => {
  // The engine derives a weight/zone base + 18% GST. For a typical ~0.5-1.0kg
  // REST_OF_INDIA delivery that raw amount is 105 + 18.9 = 123.9. It must be
  // capped at 55% of a ₹112 item value so the charge lands near ₹60 instead of
  // exceeding the product price.
  it('brings a ₹112 item delivery charge down to ~₹60 instead of ~₹123', () => {
    // Raw charge reproduces the pre-fix estimate: REST_OF_INDIA 0.5-1.0kg base
    // (105) plus 18% GST, which is exactly the ~₹123 that was being charged.
    const rawCharge = 105 + calculateTax(105, 0.18); // 123.9
    const capped = applyDeliveryProportionalCap(rawCharge, 112);
    // 112 * 0.55 = 61.6 — "approximately ₹60", and far below the product price.
    assert.ok(capped < 112, 'delivery must not exceed the product price');
    assert.ok(capped >= 55 && capped <= 65, `expected ~₹60, got ${capped}`);
  });

  it('keeps weight/zone charge for high-value orders unchanged', () => {
    // A ₹5000 item: the 55% cap (2750) is far above the raw ₹123.9, so the raw
    // weight/zone-derived amount is preserved exactly as before.
    const rawCharge = 105 + calculateTax(105, 0.18); // 123.9
    assert.equal(applyDeliveryProportionalCap(rawCharge, 5000), rawCharge);
  });

  it('keeps heavy (expensive) multi-kg orders unchanged', () => {
    // e.g. a heavier item charged ₹180 base + tax = 212.4, for a ₹1200 item.
    const rawCharge = 180 + calculateTax(180, 0.18); // 212.4
    const capped = applyDeliveryProportionalCap(rawCharge, 1200);
    assert.equal(capped, rawCharge); // cap (660) > raw (212.4)
  });

  it('passes through unchanged when no order value is available', () => {
    assert.equal(applyDeliveryProportionalCap(123.9, 0), 123.9);
    assert.equal(applyDeliveryProportionalCap(123.9), 123.9);
    assert.equal(applyDeliveryProportionalCap(80, undefined), 80);
  });

  it('scales proportionally across low-priced items', () => {
    // At low item values the charge tracks the item value (55%), staying below
    // the product price and scaling up with it.
    assert.ok(applyDeliveryProportionalCap(123.9, 50) <= 50);
    assert.ok(applyDeliveryProportionalCap(123.9, 112) <= 112);
    assert.ok(applyDeliveryProportionalCap(123.9, 250) < 250);
    // And it is monotonic: more expensive orders may receive a higher charge.
    assert.ok(
      applyDeliveryProportionalCap(123.9, 250) >= applyDeliveryProportionalCap(123.9, 112),
    );
  });
});