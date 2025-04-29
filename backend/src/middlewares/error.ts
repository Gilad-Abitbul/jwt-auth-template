import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/HttpError';


// Global error handling middleware
const errorHandler = (
  error: Error | HttpError,
  request: Request,
  response: Response,
  next: NextFunction
): void => {

  if (!(error instanceof HttpError)) {
    error = new HttpError(error.message || 'Internal server error', 500);
  }

  const statusCode = (error as HttpError).statusCode || 500; // Default to 500 if no statusCode
  const message = (error as HttpError).message || 'Internal server error'; // Default message
  const details = (error as HttpError).details || null; // Error details if available

  response.status(statusCode).json({
    message: message,
    details: details,
  });
};

export default errorHandler;