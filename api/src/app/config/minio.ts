import { Client } from 'minio';
import { env } from './env';

export const minioClient = new Client({
  endPoint: env.minioEndpoint,
  port: env.minioPort,
  useSSL: env.minioUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey,
 
});

export const publicMinioClient = new Client({
  endPoint: env.minioPublicEndpoint,
  port: env.minioPublicPort,
  useSSL: env.minioUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey,
 
});

export const ensureMinioBucket = async () => {
  const exists = await minioClient.bucketExists(env.minioBucket);

  if (!exists) {
    await minioClient.makeBucket(env.minioBucket);
    console.log(`MinIO bucket "${env.minioBucket}" created`);
  } else {
    console.log(`MinIO bucket "${env.minioBucket}" already exists`);
  }
};