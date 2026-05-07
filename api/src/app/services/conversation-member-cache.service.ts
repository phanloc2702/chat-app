import { AppDataSource } from '../config/data-source';
import { redisClient } from '../config/redis';
import { ConversationMember } from '../entities/conversation-member.entity';

const conversationMemberRepository =
  AppDataSource.getRepository(ConversationMember);

const CACHE_TTL_SECONDS = 10 * 60;

const getConversationMembersCacheKey = (conversationId: number) => {
  return `conversation:${conversationId}:members`;
};

export type CachedConversationMember = {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
};

export const getConversationMembersFromCacheOrDb = async (
  conversationId: number
): Promise<CachedConversationMember[]> => {
  const cacheKey = getConversationMembersCacheKey(conversationId);

  const cachedValue = await redisClient.get(cacheKey);

  if (cachedValue) {
    console.log(`[cache] HIT ${cacheKey}`);
    return JSON.parse(cachedValue) as CachedConversationMember[];
  }

  console.log(`[cache] MISS ${cacheKey}`);

  const members = await conversationMemberRepository.find({
    where: {
      conversationId,
    },
    relations: {
      user: true,
    },
  });

  const result: CachedConversationMember[] = members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
    email: member.user.email,
    avatarUrl: member.user.avatarUrl,
    isOnline: member.user.isOnline,
  }));

  await redisClient.set(cacheKey, JSON.stringify(result), {
    EX: CACHE_TTL_SECONDS,
  });

  return result;
};

export const invalidateConversationMembersCache = async (
  conversationId: number
) => {
  const cacheKey = getConversationMembersCacheKey(conversationId);

  await redisClient.del(cacheKey);

  console.log(`[cache] DEL ${cacheKey}`);
};