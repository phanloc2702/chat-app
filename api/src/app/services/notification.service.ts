import { AppDataSource } from '../config/data-source';
import { Notification, NotificationType } from '../entities/notification.entity';

const notificationRepository = AppDataSource.getRepository(Notification);

export const createNotification = async (payload: {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedConversationId?: number | null;
}) => {
  const notification = notificationRepository.create({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    relatedConversationId: payload.relatedConversationId ?? null,
    isRead: false,
  });

  const savedNotification = await notificationRepository.save(notification);

  return savedNotification;
};

export const getMyNotifications = async (userId: number) => {
  const notifications = await notificationRepository.find({
    where: { userId },
    order: {
      createdAt: 'DESC',
    },
  });

  return notifications;
};

export const markAsRead = async (notificationId: number, userId: number) => {
  const notification = await notificationRepository.findOne({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  return notificationRepository.save(notification);
};