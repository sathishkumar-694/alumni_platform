import { ApiError } from '../shared/ApiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized access attempt'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Forbidden: ${req.user.role} role is not permitted to perform this operation`));
    }

    next();
  };
};

export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized access attempt'));
  }

  // Admins do not require student/alumni verification check
  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.verification_status !== 'VERIFIED') {
    return next(new ApiError(403, `Access Restricted: Your account verification status is currently '${req.user.verification_status}'. Only verified accounts can perform this action.`));
  }

  next();
};
