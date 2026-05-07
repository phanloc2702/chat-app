import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const users = await userService.getAllUsers(currentUserId);

    return res.status(200).json({
      message: 'Get users successfully',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get users',
    });
  }
};