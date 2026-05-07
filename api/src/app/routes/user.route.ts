import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/', authenticate, userController.getAllUsers);

export default router;