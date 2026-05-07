import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json({
      message: 'Register successfully',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Register failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      message: 'Login successfully',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
};