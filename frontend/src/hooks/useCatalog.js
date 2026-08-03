import { useEffect, useState } from 'react';

import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';

export function useProducts(searchParams) {
  const [state, setState] = useState({ products: [], pagination: null, isLoading: true, error: '' });
  const query = searchParams.toString();

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: '' }));

    api.get(`/products${query ? `?${query}` : ''}`, { signal: controller.signal })
      .then((response) => {
        const data = response.data?.data ?? {};
        setState({ products: data.products ?? [], pagination: data.pagination ?? null, isLoading: false, error: '' });
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setState({ products: [], pagination: null, isLoading: false, error: getApiError(error, 'The collection could not be loaded.').message });
        }
      });

    return () => controller.abort();
  }, [query]);

  return state;
}

export function useProduct(identifier) {
  const [state, setState] = useState({ product: null, relatedProducts: [], isLoading: true, error: '' });

  useEffect(() => {
    if (!identifier) return;
    
    const controller = new AbortController();
    setState({ product: null, relatedProducts: [], isLoading: true, error: '' });

    api.get(`/products/${identifier}`, { signal: controller.signal })
      .then((response) => {
        const product = response.data?.data?.product;
        if (!product) {
          setState({ product: null, relatedProducts: [], isLoading: false, error: 'Product could not be loaded.' });
          return;
        }
        setState((current) => ({ ...current, product, isLoading: false }));
        
        // Fetch related products
        return api.get(`/products/${product._id}/related`, { params: { limit: 6 }, signal: controller.signal });
      })
      .then((response) => {
        if (response?.data?.data?.products) {
          setState((current) => ({ ...current, relatedProducts: response.data.data.products }));
        }
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setState({ product: null, relatedProducts: [], isLoading: false, error: getApiError(error, 'Product could not be loaded.').message });
        }
      });

    return () => controller.abort();
  }, [identifier]);

  return state;
}

export function useCategories() {
  const [state, setState] = useState({ categories: [], isLoading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    api.get('/categories', { signal: controller.signal })
      .then((response) => setState({ categories: response.data?.data?.categories ?? [], isLoading: false, error: '' }))
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setState({ categories: [], isLoading: false, error: getApiError(error, 'Categories could not be loaded.').message });
        }
      });
    return () => controller.abort();
  }, []);

  return state;
}
