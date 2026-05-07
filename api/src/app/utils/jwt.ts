import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export const signAccessToken = (payload: JwtPayload) => {
  const secret: Secret = env.jwtSecret;

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret as Secret) as JwtPayload;
};