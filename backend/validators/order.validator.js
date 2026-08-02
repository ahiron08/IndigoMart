import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier.');

const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(100).default('India'),
});

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: addressSchema,
    paymentMethod: z.literal('cod', {
      errorMap: () => ({ message: 'Online payment is not available until a payment provider is configured.' }),
    }),
    customerNote: z.string().trim().max(500).optional().default(''),
  }),
});

export const orderIdSchema = z.object({ params: z.object({ id: objectId }) });

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});
