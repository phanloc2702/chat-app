import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USER } from '../config.js';

export const options = {
  vus: 1,
  duration: '10s',

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const payload = JSON.stringify(TEST_USER);

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('data.accessToken') !== undefined,
  });

  sleep(1);
}
