import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../src/middlewares/errorHandler';
import HttpError from '../../src/utils/HttpError';

describe('errorHandler middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle generic Error as 500 HttpError', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
  });

  it('should handle HttpError with statusCode and message', () => {
    const error = new HttpError('Not Found', 404);

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not Found' });
  });

  it('should include details and meta in the response if provided', () => {
    const error = new HttpError('Validation failed', 400, { "email": ['email is required'] }, { hint: 'Check email format' });

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      details: { "email": ['email is required'] },
      meta: { hint: 'Check email format' },
    });
  });

  it('should default to status 500 and message if values are missing', () => {
    const error = new HttpError('');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
