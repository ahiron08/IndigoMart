import AppError from '../utils/app-error.js';

export const notFoundHandler = (request, _response, next) => {
  next(new AppError(`Route ${request.method} ${request.originalUrl} was not found.`, 404));
};

export const errorHandler = (error, _request, response, _next) => {
  let normalizedError = error;

  if (error.code === 11000) {
    normalizedError = new AppError('A record with that value already exists.', 409);
  } else if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    normalizedError = new AppError('Database validation failed.', 422, details);
  } else if (error.name === 'CastError') {
    normalizedError = new AppError(`Invalid value for ${error.path}.`, 400);
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    normalizedError = new AppError('Request body contains invalid JSON.', 400);
  }

  const statusCode = normalizedError.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!normalizedError.isOperational) {
    console.error(normalizedError);
  }

  response.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? 'An unexpected error occurred.' : normalizedError.message,
    ...(normalizedError.details ? { errors: normalizedError.details } : {}),
    ...(!isProduction && normalizedError.stack ? { stack: normalizedError.stack } : {}),
  });
};
