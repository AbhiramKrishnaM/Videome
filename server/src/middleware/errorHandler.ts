import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Error interface
interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Resource not found',
    });
    return;
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      error: 'Duplicate field value entered',
    });
    return;
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
    });
    return;
  }
  
  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
  });
}; 