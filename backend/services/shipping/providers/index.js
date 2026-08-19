import { env } from '../../../config/env.js';
import { ShippingProvider } from './provider.base.js';
import { InternalShippingProvider } from './internal.provider.js';
import { DelhiveryProvider } from './delhivery.provider.js';
import { ShiprocketProvider } from './shiprocket.provider.js';

export { ShippingProvider };
export { InternalShippingProvider };
export { DelhiveryProvider };
export { ShiprocketProvider };

const providers = {
  INTERNAL: () => new InternalShippingProvider(),
  DELHIVERY: () => new DelhiveryProvider(),
  SHIPROCKET: () => new ShiprocketProvider(),
};

const PROVIDER_ALIASES = {
  internal: 'INTERNAL',
  delhivery: 'DELHIVERY',
  shiprocket: 'SHIPROCKET',
};

/**
 * Resolve the configured shipping provider (defaults to INTERNAL).
 * @returns {ShippingProvider}
 */
export const resolveProvider = (providerName) => {
  const normalized = String(providerName || env.SHIPPING_PROVIDER || 'INTERNAL')
    .toUpperCase()
    .replace(/\s+/g, '');
  const key = PROVIDER_ALIASES[normalized] || normalized;
  const factory = providers[key];
  if (!factory) {
    // Unknown provider requested → fall back to internal rather than failing.
    return new InternalShippingProvider();
  }
  return factory();
};

export default {
  resolveProvider,
  ShippingProvider,
  InternalShippingProvider,
  DelhiveryProvider,
  ShiprocketProvider,
};