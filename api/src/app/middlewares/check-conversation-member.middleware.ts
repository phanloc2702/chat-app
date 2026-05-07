import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppDataSource } from '../config/data-source';
import { ConversationMember } from '../entities/conversation-member.entity';

const conversationMemberRepository =
  AppDataSource.getRepository(ConversationMember);

export const checkConversationMember: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const currentUserId = req.user?.userId;

  const conversationId = Number(
    req.params.conversationId || req.params.id || req.body.conversationId
  );

  if (!currentUserId) {
    res.status(401).json({
      message: 'Unauthorized',
    });
    return;
  }

  if (!conversationId || Number.isNaN(conversationId)) {
    res.status(400).json({
      message: 'Invalid conversation id',
    });
    return;
  }

  const member = await conversationMemberRepository.findOne({
    where: {
      conversationId,
      userId: currentUserId,
    },
  });

  if (!member) {
    res.status(403).json({
      message: 'You are not a member of this conversation',
    });
    return;
  }

  req.conversationMember = member;

  next();
};