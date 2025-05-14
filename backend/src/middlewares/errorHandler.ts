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

  const httpError = error as HttpError;

  const statusCode = httpError.statusCode || 500;
  const message = httpError.message || 'Internal server error';
  const details = httpError.details;
  const meta = httpError.meta;

  const errorResponse: Record<string, any> = { message };
  if (details !== undefined && details !== null) {
    errorResponse.details = details;
  }

  if (meta !== undefined && meta !== null) {
    errorResponse.meta = meta;
  }
  response.status(statusCode).json(errorResponse);
};

export default errorHandler;