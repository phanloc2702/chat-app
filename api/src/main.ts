import 'reflect-metadata';
import http from 'http';
import app from './app/app';
import { env } from './app/config/env';
import { AppDataSource } from './app/config/data-source';
import { initSocket } from './app/config/socket';
import { registerSocketHandlers } from './app/sockets';
import { ensureMinioBucket } from './app/config/minio';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL connected');

    await ensureMinioBucket();

    const server = http.createServer(app);
    const io = await initSocket(server);

    registerSocketHandlers(io);

    server.listen(env.port, () => {
      console.log(`API server is running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();