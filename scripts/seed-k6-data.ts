import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

import { AppDataSource } from '../api/src/app/config/data-source';
import { User, UserRole } from '../api/src/app/entities/user.entity';
import {
  Conversation,
  ConversationType,
} from '../api/src/app/entities/conversation.entity';
import { ConversationMember } from '../api/src/app/entities/conversation-member.entity';

const USER_COUNT = Number(process.env.K6_USER_COUNT || 2000);
const DEFAULT_PASSWORD = process.env.K6_USER_PASSWORD || '123456';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

function generateAccessToken(user: User) {
  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    signOptions,
  );
}

async function main() {
  if (USER_COUNT % 2 !== 0) {
    throw new Error('K6_USER_COUNT must be an even number');
  }

  await AppDataSource.initialize();
  console.log('Database connected');

  const userRepository = AppDataSource.getRepository(User);
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const conversationMemberRepository =
    AppDataSource.getRepository(ConversationMember);

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users: User[] = [];

  for (let i = 1; i <= USER_COUNT; i++) {
    const email = `k6_user_${i}@gmail.com`;
    const username = `k6_user_${i}`;

    let user = await userRepository.findOne({
      where: { email },
    });

    if (!user) {
      user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        avatarUrl: null,
        isOnline: false,
        role: UserRole.USER,
      });

      user = await userRepository.save(user);
      console.log(`Created user: ${email}`);
    } else {
      console.log(`User already exists: ${email}`);
    }

    users.push(user);
  }

  const k6Conversations: Array<{
    conversationId: number;
    user1: {
      id: number;
      email: string;
      password: string;
      accessToken: string;
    };
    user2: {
      id: number;
      email: string;
      password: string;
      accessToken: string;
    };
  }> = [];

  for (let i = 0; i < users.length; i += 2) {
    const user1 = users[i];
    const user2 = users[i + 1];

    const conversationName = `k6_private_${user1.id}_${user2.id}`;

    let conversation = await conversationRepository.findOne({
      where: { name: conversationName },
    });

    if (!conversation) {
      conversation = conversationRepository.create({
        type: ConversationType.PRIVATE,
        name: conversationName,
        createdById: user1.id,
        lastMessageId: null,
        lastMessageAt: null,
      });

      conversation = await conversationRepository.save(conversation);

      console.log(
        `Created conversation ${conversation.id}: ${user1.email} <-> ${user2.email}`,
      );
    } else {
      console.log(
        `Conversation already exists ${conversation.id}: ${user1.email} <-> ${user2.email}`,
      );
    }

    const member1 = await conversationMemberRepository.findOne({
      where: {
        conversationId: conversation.id,
        userId: user1.id,
      },
    });

    if (!member1) {
      await conversationMemberRepository.save(
        conversationMemberRepository.create({
          conversationId: conversation.id,
          userId: user1.id,
          lastReadAt: null,
        }),
      );
    }

    const member2 = await conversationMemberRepository.findOne({
      where: {
        conversationId: conversation.id,
        userId: user2.id,
      },
    });

    if (!member2) {
      await conversationMemberRepository.save(
        conversationMemberRepository.create({
          conversationId: conversation.id,
          userId: user2.id,
          lastReadAt: null,
        }),
      );
    }

    k6Conversations.push({
      conversationId: conversation.id,
      user1: {
        id: user1.id,
        email: user1.email,
        password: DEFAULT_PASSWORD,
        accessToken: generateAccessToken(user1),
      },
      user2: {
        id: user2.id,
        email: user2.email,
        password: DEFAULT_PASSWORD,
        accessToken: generateAccessToken(user2),
      },
    });
  }

  const outputDir = path.join(process.cwd(), 'k6-tests', 'data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'k6-conversations.json'),
    JSON.stringify(k6Conversations, null, 2),
  );

  fs.writeFileSync(
    path.join(outputDir, 'k6-users.json'),
    JSON.stringify(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        password: DEFAULT_PASSWORD,
        accessToken: generateAccessToken(user),
      })),
      null,
      2,
    ),
  );

  console.log('Seed k6 data successfully');
  console.log(`Users: ${users.length}`);
  console.log(`Conversations: ${k6Conversations.length}`);
  console.log('Generated: k6-tests/data/k6-users.json');
  console.log('Generated: k6-tests/data/k6-conversations.json');

  await AppDataSource.destroy();
}

main().catch(async (error) => {
  console.error('Seed k6 data failed:', error);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(1);
});
