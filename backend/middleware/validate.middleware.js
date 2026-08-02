import AppError from '../utils/app-error.js';

export const validate = (schema) => (request, _response, next) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.').replace(/^(body|params|query)\./, ''),
      message: issue.message,
    }));
    next(new AppError('Request validation failed.', 422, details));
    return;
  }

  if (result.data.body) request.body = result.data.body;
  if (result.data.params) request.params = result.data.params;
  next();
};
