import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import { sendMessageSchema } from '../validators/message.validator';
import { uploadImage } from '../middlewares/upload.middleware';
import { checkConversationMember } from '../middlewares/check-conversation-member.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  validate(sendMessageSchema),
  messageController.sendMessage
);

router.post(
  '/image',
  authenticate,
  checkConversationMember,
  uploadImage.single('image'),
  messageController.sendImageMessage
);

router.get('/:conversationId', authenticate, checkConversationMember, messageController.getMessagesByConversation);

export default router;