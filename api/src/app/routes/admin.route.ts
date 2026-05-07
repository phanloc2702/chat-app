import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorizeRoles } from '../middlewares/authorize-roles.middleware';
import { UserRole } from '../entities/user.entity';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  (req, res) => {
    return res.status(200).json({
      message: 'Get admin dashboard successfully',
      data: {
        currentUser: req.user,
        secret: 'Only ADMIN can see this',
      },
    });
  }
);

router.get(
  '/profile',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.USER),
  (req, res) => {
    return res.status(200).json({
      message: 'Get profile successfully',
      data: {
        currentUser: req.user,
      },
    });
  }
);

export default router;