import { Router } from 'express';
import * as conversationController from '../controllers/conversation.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createGroupConversationSchema,
  createPrivateConversationSchema,
} from '../validators/conversation.validator';
import { checkConversationMember } from '../middlewares/check-conversation-member.middleware';

const router = Router();

router.get('/', authenticate, conversationController.getMyConversations);

router.patch(
  '/:id/read',
  authenticate,
  checkConversationMember,
  conversationController.markConversationAsRead
);

router.post(
  '/private',
  authenticate,
  validate(createPrivateConversationSchema),
  conversationController.createPrivateConversation
);

router.post(
  '/group',
  authenticate,
  validate(createGroupConversationSchema),
  conversationController.createGroupConversation
);

export default router;