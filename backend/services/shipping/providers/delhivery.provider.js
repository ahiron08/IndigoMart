import { env } from '../../../config/env.js';
import { ShippingProvider } from './provider.base.js';
import { InternalShippingProvider } from './internal.provider.js';

/**
 * DelhiveryShippingProvider — adapter for the Delhivery developer API.
 *
 * Integration points:
 *  - PIN-code serviceability:  GET /api/pin-codes/json/?filter_codes=<pin>
 *  - Rate calculation:         GET /api/kinko/v1/invoice/charges/.json
 *  - Shipment creation/tracking require a production API key and are NOT wired
 *    up yet. Credentials are read from the DELHIVERY_API_KEY env var.
 *
 * When no API key is configured we transparently fall back to the internal
 * engine so checkout still works during rollout. No website scraping is done
 * and no commercial rates are hardcoded.
 */
export class DelhiveryProvider extends ShippingProvider {
  constructor() {
    super();
    this.apiKey = env.DELHIVERY_API_KEY || '';
    this.baseUrl = 'https://track.delhivery.com';
    // Internal engine used as the fallback / estimate baseline.
    this._internal = new InternalShippingProvider();
  }

  get name() {
    return 'DELHIVERY';
  }

  get configured() {
    return Boolean(this.apiKey);
  }

  async checkServiceability(params) {
    if (!this.configured) {
      return this._internal.checkServiceability(params);
    }

    // TODO: parse the /api/pin-codes/json/ response to derive serviceability.
    // Delhivery's response shape is transient and account-dependent; wire it
    // against real credentials before relying on it.
    return {
      isServiceable: true,
      estimatedDays: '3-5',
      error: null,
    };
  }

  async calculateRate(params) {
    if (!this.configured) {
      return this._internal.calculateRate({
        ...params,
        provider: 'DELHIVERY',
        isExternal: false,
      });
    }

    // TODO: call the Delhivery charges endpoint and map the response into the
    // shared rate shape. Fall back to the internal estimate until then.
    return this._internal.calculateRate({
      ...params,
      provider: 'DELHIVERY',
      isExternal: false,
    });
  }

  async createShipment() {
    throw new Error('Delhivery createShipment is not implemented yet.');
  }

  async trackShipment() {
    throw new Error('Delhivery trackShipment is not implemented yet.');
  }
}

export default DelhiveryProvider;