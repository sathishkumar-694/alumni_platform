import jwt from 'jsonwebtoken';
import { ApiError } from '../shared/ApiError.js';
import { config } from '../config/env.js';
import { db } from '../config/db.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized: Missing or invalid authorization token format');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Unauthorized: Missing token');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.users.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'Unauthorized: Invalid token or user no longer exists');
    }

    if (user.verification_status === 'SUSPENDED') {
      throw new ApiError(403, 'Forbidden: Account is suspended by administration');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Unauthorized: Invalid token signature'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Unauthorized: Session expired, please log in again'));
    }
    next(error);
  }
};
