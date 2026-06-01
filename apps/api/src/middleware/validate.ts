import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/** Validate request body against a Zod schema */
export const validateBody = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) { next(result.error); return; }
    req.body = result.data;
    next();
  };

/** Validate query params against a Zod schema */
export const validateQuery = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) { next(result.error); return; }
    req.query = result.data;
    next();
  };
