import { ShippingProvider } from './provider.base.js';
import { runEstimate } from '../engine.js';
import { checkPincodeServiceability } from '../pincode.service.js';

/**
 * InternalShippingProvider — computes store-defined estimated shipping costs
 * from local DB rate cards (no external courier API).
 *
 * This is the initial rate engine. Its methods mirror the ShippingProvider
 * contract so a real courier provider can be swapped in later.
 */
export class InternalShippingProvider extends ShippingProvider {
  get name() {
    return 'INTERNAL';
  }

  async checkServiceability({ originPincode, destinationPincode, shippingMode, paymentMethod }) {
    return checkPincodeServiceability(originPincode, destinationPincode, {
      paymentMethod,
      shippingMode,
    });
  }

  async calculateRate(params) {
    return runEstimate({ ...params, provider: 'INTERNAL', isExternal: false, carrier: 'INTERNAL' });
  }

  async createShipment() {
    // Internal provider does not book with a courier.
    throw new Error('createShipment is not supported by the InternalShippingProvider.');
  }

  async trackShipment() {
    throw new Error('trackShipment is not supported by the InternalShippingProvider.');
  }
}

export default InternalShippingProvider;