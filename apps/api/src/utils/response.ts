import type { Response } from 'express';

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  perPage: number
) {
  return ok(res, {
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}
