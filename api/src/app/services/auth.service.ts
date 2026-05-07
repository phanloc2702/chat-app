import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { signAccessToken } from '../utils/jwt';

const userRepository = AppDataSource.getRepository(User);

export const register = async (payload: {
  username: string;
  email: string;
  password: string;
}) => {
  const existingUserByEmail = await userRepository.findOne({
    where: { email: payload.email },
  });

  if (existingUserByEmail) {
    throw new Error('Email already exists');
  }

  const existingUserByUsername = await userRepository.findOne({
    where: { username: payload.username },
  });

  if (existingUserByUsername) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = userRepository.create({
    username: payload.username,
    email: payload.email,
    password: hashedPassword,
    avatarUrl: null,
    isOnline: false,
    // role không cần set nếu entity đã default USER
  });

  const savedUser = await userRepository.save(user);

  const token = signAccessToken({
    userId: savedUser.id,
    email: savedUser.email,
    role: savedUser.role,
  });

  return {
    user: {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      avatarUrl: savedUser.avatarUrl,
      isOnline: savedUser.isOnline,
      role: savedUser.role,
    },
    accessToken: token,
  };
};

export const login = async (payload: { email: string; password: string }) => {
  const user = await userRepository.findOne({
    where: { email: payload.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isOnline: user.isOnline,
      role: user.role,
    },
    accessToken: token,
  };
};