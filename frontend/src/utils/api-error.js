export const getApiError = (error, fallback = 'Something went wrong. Please try again.') => ({
  message: error.response?.data?.message || fallback,
  fields: Object.fromEntries(
    (error.response?.data?.errors || [])
      .filter((item) => item.field)
      .map((item) => [item.field, item.message]),
  ),
});
