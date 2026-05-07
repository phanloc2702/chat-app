import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const notifications = await notificationService.getMyNotifications(userId);

    return res.status(200).json({
      message: 'Get notifications successfully',
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get notifications',
    });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const notificationId = Number(req.params.notificationId);

    const notification = await notificationService.markAsRead(
      notificationId,
      userId
    );

    return res.status(200).json({
      message: 'Mark notification as read successfully',
      data: notification,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Mark notification as read failed',
    });
  }
};