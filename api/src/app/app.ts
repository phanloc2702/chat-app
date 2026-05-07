import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import conversationRoutes from './routes/conversation.route';
import messageRoutes from './routes/message.route';
import notificationRoutes from './routes/notification.route';
import adminRoute from './routes/admin.route';
const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);

app.use(express.json());

app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoute);
export default app;
