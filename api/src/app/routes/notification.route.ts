import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.patch('/:notificationId/read', authenticate, notificationController.markAsRead);

export default router;