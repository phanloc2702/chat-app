import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/user.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.dbHost,
  port: Number(env.dbPort),
  username: env.dbUser,
  password: String(env.dbPassword),
  database: env.dbName,
  synchronize: true,
  logging: false,
  entities: [User, Conversation, ConversationMember, Message, Notification],
  migrations: [],
});