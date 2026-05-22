import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_USER } from '../config.js';

export function login(user = TEST_USER) {
  const payload = JSON.stringify(user);

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'POST /api/auth/login',
    },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => r.json('data.accessToken') !== undefined,
  });

  return res.json('data.accessToken');
}