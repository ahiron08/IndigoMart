import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier.');

const pincode = z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian pincode.');

const itemSchema = z.object({
  productId: objectId,
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(99, 'Quantity cannot exceed 99.'),
});

export const calculateShippingSchema = z.object({
  body: z.object({
    destinationPincode: pincode,
    originPincode: pincode.optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required.'),
    paymentMethod: z.enum(['PREPAID', 'COD'], {
      errorMap: () => ({ message: 'paymentMethod must be PREPAID or COD.' }),
    }).default('PREPAID'),
    shippingMode: z.enum(['SURFACE', 'EXPRESS'], {
      errorMap: () => ({ message: 'shippingMode must be SURFACE or EXPRESS.' }),
    }).default('SURFACE'),
    orderValue: z.coerce
      .number()
      .min(0, 'orderValue must be a non-negative number.')
      .default(0),
  }),
});

export const serviceabilitySchema = z.object({
  query: z.object({
    deliveryPincode: pincode,
    pickupPincode: pincode.optional(),
  }),
});

export const productDimensionsSchema = z.object({
  params: z.object({ productId: objectId }),
});

const weightSlab = z.coerce
  .number()
  .min(0, 'weightFrom/weightTo must be non-negative.');

export const createZoneSchema = z.object({
  body: z.object({
    zoneCode: z.string().trim().min(1, 'zoneCode is required.').max(8),
    name: z.string().trim().min(1, 'name is required.'),
    description: z.string().optional(),
    priority: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().optional(),
  }),
});

export const createZoneRuleSchema = z.object({
  body: z.object({
    zone: z.string().trim().min(1, 'zone is required.'),
    pincode: pincode.optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    pincodeRanges: z
      .array(
        z.object({
          from: z.coerce.number().int().min(1000).max(999999),
          to: z.coerce.number().int().min(1000).max(999999),
        }),
      )
      .optional(),
    priority: z.coerce.number().int().min(0).default(0),
    isExclusive: z.boolean().optional(),
  }),
});

export const createRateSchema = z.object({
  body: z.object({
    zone: z.string().trim().min(1, 'zone is required.'),
    mode: z.enum(['SURFACE', 'EXPRESS', 'AIR'], {
      errorMap: () => ({ message: 'mode must be SURFACE, EXPRESS or AIR.' }),
    }),
    carrier: z.string().trim().min(1, 'carrier is required.'),
    weightFrom: weightSlab,
    weightTo: weightSlab,
    baseCharge: z.coerce.number().min(0),
    perKgCharge: z.coerce.number().min(0).default(0),
    currency: z.string().length(3).default('INR'),
    minChargeable: z.coerce.number().min(0).default(0),
    isActive: z.boolean().optional(),
  }),
});

export const upsertPincodeSchema = z.object({
  body: z.object({
    pincode,
    city: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    serviceable: z.boolean().optional(),
    codAvailable: z.boolean().optional(),
    zone: z.string().optional(),
  }),
});

export const configSchema = z.object({
  body: z.object({
    baseCharge: z.coerce.number().min(0).optional(),
    perKmRate: z.coerce.number().min(0).optional(),
    expressSurcharge: z.coerce.number().min(0).optional(),
    codCharge: z
      .object({
        fixed: z.coerce.number().min(0).optional(),
        percentage: z.coerce.number().min(0).optional(),
      })
      .optional(),
    remoteAreaSurcharge: z.coerce.number().min(0).optional(),
    volumetricDivisor: z.coerce.number().min(1).default(5000),
    roundingRule: z.enum(['CEIL', 'ROUND', 'FLOOR']).optional(),
    defaultZoneId: objectId.optional(),
    originPincode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
    currency: z.string().length(3).default('INR'),
  }),
});

export default {
  calculateShippingSchema,
  serviceabilitySchema,
  productDimensionsSchema,
  createZoneSchema,
  createZoneRuleSchema,
  createRateSchema,
  upsertPincodeSchema,
  configSchema,
};