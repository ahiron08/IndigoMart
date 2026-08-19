import { useState, useCallback } from 'react';
import { calculateShipping } from '@/services/shipping.js';

/**
 * Hook for fetching an estimated delivery charge from the internal rate
 * engine. Product data is resolved server-side; the client only supplies the
 * destination PIN and order lines.
 *
 * @returns {{
 *   estimate: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   getEstimate: (payload:object) => Promise<object|null>
 * }}
 */
export const useShippingEstimate = () => {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getEstimate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateShipping(payload);
      setEstimate(result);
      return result;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Unable to estimate shipping. Please check the pincode or try again.';
      setError(message);
      setEstimate(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { estimate, loading, error, getEstimate };
};

export default useShippingEstimate;