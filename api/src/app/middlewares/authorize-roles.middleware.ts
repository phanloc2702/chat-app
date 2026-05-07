import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../entities/user.entity';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentRole = req.user?.role;

    if (!currentRole) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        message: 'Forbidden: insufficient permission',
      });
    }

    return next();
  };
};