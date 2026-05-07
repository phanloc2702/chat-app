import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Schema } from 'joi';

export const validate = (schema: Schema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.details.map((item) => item.message),
      });
      return;
    }

    req.body = value;
    next();
  };
};
