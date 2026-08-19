import { env } from '../../../config/env.js';
import { ShippingProvider } from './provider.base.js';
import { InternalShippingProvider } from './internal.provider.js';

/**
 * ShiprocketShippingProvider — adapter for the Shiprocket API.
 *
 * Credentials would come from SHIPROCKET_* env vars. As with the Delhivery
 * provider, this is a rollout-safe shell: until credentials/integration are
 * wired up it transparently delegates to the internal engine so checkout keeps
 * working. No rates are hardcoded.
 */
export class ShiprocketProvider extends ShippingProvider {
  constructor() {
    super();
    this.email = env.SHIPROCKET_EMAIL || '';
    this.password = env.SHIPROCKET_PASSWORD || '';
    this.token = ''; // obtained at runtime from the auth endpoint
    this._internal = new InternalShippingProvider();
  }

  get name() {
    return 'SHIPROCKET';
  }

  get configured() {
    return Boolean(this.email && this.password);
  }

  async checkServiceability(params) {
    if (!this.configured) {
      return this._internal.checkServiceability(params);
    }
    return {
      isServiceable: true,
      estimatedDays: '3-6',
      error: null,
    };
  }

  async calculateRate(params) {
    if (!this.configured) {
      return this._internal.calculateRate({ ...params, provider: 'SHIPROCKET' });
    }
    // TODO: call Shiprocket's courier tariff endpoint.
    return this._internal.calculateRate({ ...params, provider: 'SHIPROCKET' });
  }

  async createShipment() {
    throw new Error('Shiprocket createShipment is not implemented yet.');
  }

  async trackShipment() {
    throw new Error('Shiprocket trackShipment is not implemented yet.');
  }
}

export default ShiprocketProvider;