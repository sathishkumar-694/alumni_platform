import { ApiError } from '../shared/ApiError.js';

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  if (error.statusCode >= 500) {
    console.error('Server Error [500]:', err);
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors,
    stack: error.stack
  };

  return res.status(error.statusCode).json(response);
};
