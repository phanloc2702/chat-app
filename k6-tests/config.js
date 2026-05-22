export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'loc1@gmail.com',
  password: __ENV.TEST_PASSWORD || '123456',
};

export const TEST_USERS = [
  {
    email: __ENV.TEST_EMAIL_1 || 'loc1@gmail.com',
    password: __ENV.TEST_PASSWORD_1 || '123456',
  },
  {
    email: __ENV.TEST_EMAIL_2 || 'loc2@gmail.com',
    password: __ENV.TEST_PASSWORD_2 || '123456',
  },
];