import path from 'path';
import crypto from 'crypto';
import { minioClient, publicMinioClient } from '../config/minio';
import { env } from '../config/env';

const ensureBucketExists = async () => {
  const exists = await minioClient.bucketExists(env.minioBucket);

  if (!exists) {
    await minioClient.makeBucket(env.minioBucket);
    console.log(`[minio] bucket created: ${env.minioBucket}`);
  }
};

export const uploadChatImage = async (file: Express.Multer.File) => {
  await ensureBucketExists();

  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const ext = path.extname(file.originalname);

  const objectName = `${Date.now()}-${crypto
    .randomBytes(8)
    .toString('hex')}${ext}`;

  await minioClient.putObject(
    env.minioBucket,
    objectName,
    file.buffer,
    file.size,
    {
      'Content-Type': file.mimetype,
    }
  );

  return {
    objectName,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
  };
};

export const getPresignedImageUrl = async (objectName: string) => {
  return publicMinioClient.presignedGetObject(
    env.minioBucket,
    objectName,
    24 * 60 * 60
  );
};