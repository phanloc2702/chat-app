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

  /**
   * PostgreSQL connection pool config.
   *
   * max:
   *   Số connection tối đa mỗi API instance được mở tới Postgres.
   *
   * Hiện có api1 + api2.
   * Nếu max = 30 thì tổng tối đa khoảng 60 connections.
   */
  extra: {
    max: Number(process.env.DB_POOL_MAX || 30),
    connectionTimeoutMillis: Number(
      process.env.DB_CONNECTION_TIMEOUT_MS || 5000
    ),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  },
});