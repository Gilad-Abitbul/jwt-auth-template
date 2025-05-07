import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import HttpError from '../utils/HttpError';

export const validateBody = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors: { [key: string]: string[] } = {};

    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() || 'form';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }

    return next(new HttpError('Invalid Request Data!', 400, errors));
  }

  req.body = result.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {

    const errors: { [key: string]: string[] } = {};

    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'form';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }

    return next(new HttpError('Invalid query parameters!', 400, errors));
  }
  next();
};