import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';

const userRepository = AppDataSource.getRepository(User);

export const getAllUsers = async (currentUserId?: number) => {
  const queryBuilder = userRepository
    .createQueryBuilder('user')
    .select([
      'user.id',
      'user.username',
      'user.email',
      'user.avatarUrl',
      'user.isOnline',
      'user.createdAt',
      'user.updatedAt',
    ])
    .orderBy('user.createdAt', 'DESC');

  if (currentUserId) {
    queryBuilder.where('user.id != :currentUserId', { currentUserId });
  }

  return queryBuilder.getMany();
};

export const setUserOnlineStatus = async (
  userId: number,
  isOnline: boolean
) => {
  await userRepository.update({ id: userId }, { isOnline });
};