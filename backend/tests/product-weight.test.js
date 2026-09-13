import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  toStoredKilograms,
  convertWeightUnit,
} from '../../frontend/src/utils/weight.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

// A minimal, otherwise-valid product body. Only the weight changes between
// cases; every other field satisfies the create/update schema.
const baseBody = () => ({
  title: 'Test product',
  description:
    'A description long enough to pass the minimum-length validation rule.',
  price: 100,
  category: 'category-slug',
  brand: 'IndigoMart',
  stock: 5,
  pickupPincode: '785001',
  tags: [],
  specifications: [],
  shippingDetails: {
    weight: '', // overwritten per-case
    dimensions: { length: 10, width: 5, height: 2 },
  },
});

// Weights the seller must be able to enter (in their chosen unit) and the
// exact kilograms the system should persist for each.
const WEIGHT_CASES = [
  { raw: '10', unit: 'g', storedKg: '0.01' },
  { raw: '25', unit: 'g', storedKg: '0.025' },
  { raw: '50', unit: 'g', storedKg: '0.05' },
  { raw: '75', unit: 'g', storedKg: '0.075' },
  { raw: '100', unit: 'g', storedKg: '0.1' },
  { raw: '150', unit: 'g', storedKg: '0.15' },
  { raw: '500', unit: 'g', storedKg: '0.5' },
  { raw: '1', unit: 'kg', storedKg: '1' },
  { raw: '1.5', unit: 'kg', storedKg: '1.5' },
  // Larger weights that must keep working exactly as before:
  { raw: '2.5', unit: 'kg', storedKg: '2.5' },
  { raw: '0.35', unit: 'kg', storedKg: '0.35' },
  { raw: '0.05', unit: 'kg', storedKg: '0.05' },
];

describe('seller product weight', () => {
  it('converts entered weights (g / kg) to the exact stored kilograms', () => {
    for (const { raw, unit, storedKg } of WEIGHT_CASES) {
      assert.equal(
        toStoredKilograms(raw, unit),
        storedKg,
        `expected ${raw}${unit} to store as ${storedKg} kg`,
      );
    }
  });

  it('re-uses the never-modified converter for known-good weight values', () => {
    // Grams -> kg and kg -> grams round-trip to the same physical weight.
    assert.equal(convertWeightUnit('100', 'g', 'kg'), '0.1');
    assert.equal(convertWeightUnit('1.5', 'kg', 'g'), '1500');
    assert.equal(convertWeightUnit('10', 'kg', 'kg'), '10');
    assert.equal(convertWeightUnit('', 'g', 'kg'), '');
  });

  it('returns empty (optional weight) for blank or invalid input', () => {
    assert.equal(toStoredKilograms('', 'g'), '');
    assert.equal(toStoredKilograms(undefined, 'g'), '');
    assert.equal(toStoredKilograms('abc', 'g'), '');
    assert.equal(toStoredKilograms('-5', 'g'), '');
  });

  it('backend create schema accepts every required low/high weight as stored kg', () => {
    for (const { storedKg } of WEIGHT_CASES) {
      const body = baseBody();
      body.shippingDetails.weight = storedKg;
      const parsed = createProductSchema.safeParse({ body });
      assert.equal(
        parsed.success,
        true,
        `create should accept ${storedKg} kg but got ${JSON.stringify(parsed.error?.issues)}`,
      );
      // The parsed body should carry the number through unchanged.
      assert.equal(Number(parsed.data.body.shippingDetails.weight), Number(storedKg));
    }
  });

  it('backend update schema accepts every required low/high weight as stored kg', () => {
    for (const { storedKg } of WEIGHT_CASES) {
      const parsed = updateProductSchema.safeParse({
        params: { id: '0123456789abcdef01234567' },
        body: { shippingDetails: { weight: storedKg } },
      });
      assert.equal(
        parsed.success,
        true,
        `update should accept ${storedKg} kg but got ${JSON.stringify(parsed.error?.issues)}`,
      );
    }
  });
});