import { JwtPayload } from '../utils/jwt';
import { ConversationMember } from '../entities/conversation-member.entity';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      conversationMember?: ConversationMember;
    }
  }
}

export {};