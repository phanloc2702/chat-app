import { RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate: RequestHandler = (req, res, next): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      message: 'Unauthorized',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};