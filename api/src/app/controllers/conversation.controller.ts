import { Request, Response } from 'express';
import * as conversationService from '../services/conversation.service';

export const createPrivateConversation = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { targetUserId } = req.body;

    const conversation = await conversationService.createPrivateConversation(
      currentUserId,
      targetUserId
    );

    return res.status(201).json({
      message: 'Create private conversation successfully',
      data: conversation,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Create private conversation failed',
    });
  }
};

export const createGroupConversation = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { name, memberIds } = req.body;

    const conversation = await conversationService.createGroupConversation(
      currentUserId,
      name,
      memberIds
    );

    return res.status(201).json({
      message: 'Create group conversation successfully',
      data: conversation,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Create group conversation failed',
    });
  }
};

export const getMyConversations = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const conversations = await conversationService.getMyConversations(
      currentUserId
    );

    return res.status(200).json({
      message: 'Get conversations successfully',
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : 'Failed to get conversations',
    });
  }
};

export const markConversationAsRead = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const conversationId = Number(req.params.id);

    if (!conversationId) {
      return res.status(400).json({
        message: 'Invalid conversation id',
      });
    }

    const result = await conversationService.markConversationAsRead(
      conversationId,
      currentUserId
    );

    return res.status(200).json({
      message: 'Mark conversation as read successfully',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : 'Mark conversation as read failed',
    });
  }
};