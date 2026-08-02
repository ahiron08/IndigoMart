import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid product identifier.');

export const addCartItemSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1).max(99).default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({ productId: objectId }),
  body: z.object({ quantity: z.coerce.number().int().min(1).max(99) }),
});

export const productParamSchema = z.object({
  params: z.object({ productId: objectId }),
});
