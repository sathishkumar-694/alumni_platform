import { ApiError } from '../shared/ApiError.js';

export const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return next(new ApiError(400, `Missing required payload fields: ${missing.join(', ')}`));
    }

    next();
  };
};

export const validateEmail = (field = 'email') => {
  return (req, res, next) => {
    const email = req.body[field];
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return next(new ApiError(400, `Invalid email address format for field '${field}'`));
      }
    }
    next();
  };
};
