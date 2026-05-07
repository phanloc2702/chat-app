import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from './env';

let io: SocketIOServer | null = null;

export const initSocket = async (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  const pubClient = createClient({
    url: `redis://${env.redisHost}:${env.redisPort}`,
  });

  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  console.log('Socket.io Redis adapter connected');

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }

  return io;
};