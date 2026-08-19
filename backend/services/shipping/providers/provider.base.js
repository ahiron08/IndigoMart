/**
 * ShippingProvider — abstraction over courier integrations.
 *
 * Concrete providers implement these methods so checkout does not need to know
 * which courier is behind the scene. The internal provider computes estimates
 * from local rate cards; later Delhivery / Shiprocket providers can be dropped
 * in without rewriting the checkout flow.
 */

export class ShippingProvider {
  /** @returns {string} A unique provider identifier (e.g. 'INTERNAL'). */
  get name() {
    throw new Error('ShippingProvider.name must be implemented.');
  }

  /**
   * Check whether a destination PIN is serviceable.
   * @param {{originPincode:string, destinationPincode:string, shippingMode?:string}} params
   * @returns {Promise<{isServiceable:boolean, codAvailable?:boolean, estimatedDays?:string, message?:string, error?:string}>}
   */
  checkServiceability() {
    throw new Error('ShippingProvider.checkServiceability must be implemented.');
  }

  /**
   * Estimate / rate a shipment.
   * @param {object} params
   * @returns {Promise<object>} Provider-specific rate payload.
   */
  calculateRate() {
    throw new Error('ShippingProvider.calculateRate must be implemented.');
  }

  /**
   * Create a shipment (booking) with the courier.
   * @param {object} params
   * @returns {Promise<object>} Tracking/AWB info.
   */
  createShipment() {
    throw new Error('ShippingProvider.createShipment must be implemented.');
  }

  /**
   * Track a shipment.
   * @param {object} params
   * @returns {Promise<object>} Tracking history/status.
   */
  trackShipment() {
    throw new Error('ShippingProvider.trackShipment must be implemented.');
  }
}

export default ShippingProvider;