import * as dotenv from 'dotenv';

dotenv.config();

console.log('DB_HOST =', process.env.DB_HOST);
console.log('DB_PORT =', process.env.DB_PORT);
console.log('DB_USER =', process.env.DB_USER);
console.log('DB_PASSWORD =', process.env.DB_PASSWORD);
console.log('DB_NAME =', process.env.DB_NAME);

export const env = {
  port: Number(process.env.PORT || 3000),

  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 55432),
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'chat_app',

  jwtSecret: process.env.JWT_SECRET || 'super_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',

  minioEndpoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  minioPort: Number(process.env.MINIO_PORT || 9000),
  minioUseSSL: process.env.MINIO_USE_SSL === 'true',
  minioAccessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET || 'chat-images',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  minioPublicEndpoint:
  process.env.MINIO_PUBLIC_ENDPOINT ||
  process.env.MINIO_ENDPOINT ||
  'localhost',

  minioPublicPort: Number(
    process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || 9000
  ),
  
};