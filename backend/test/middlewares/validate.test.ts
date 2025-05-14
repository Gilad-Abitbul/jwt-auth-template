import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../src/middlewares/validate';
import HttpError from '../../src/utils/HttpError';

describe('Validation middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  describe('validateBody', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    it('should call next without error for valid body', () => {
      req.body = { email: 'test@example.com', password: '123456' };

      validateBody(schema)(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ email: 'test@example.com', password: '123456' });
    });

    it('should call next with HttpError on invalid body', () => {
      req.body = { email: 'invalid', password: '123' };

      validateBody(schema)(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      const err = next.mock.calls[0][0] as HttpError;
      expect(err.statusCode).toBe(400);
      expect(err.details).toHaveProperty('email');
      expect(err.details).toHaveProperty('password');
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().regex(/^\d+$/),
    });

    it('should call next without error for valid query', () => {
      req.query = { page: '2' };

      validateQuery(schema)(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next with HttpError on invalid query', () => {
      req.query = { page: 'abc' };

      validateQuery(schema)(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      const err = next.mock.calls[0][0] as HttpError;
      expect(err.statusCode).toBe(400);
      expect(err.details).toHaveProperty('page');
    });
  });
});
