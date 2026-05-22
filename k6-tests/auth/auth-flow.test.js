import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { login } from '../helpers/auth.helper.js';
import { authHeaders } from '../helpers/http.helper.js';

export const options = {
  vus: 5,
  duration: '20s',

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],

    'http_req_duration{name:POST /api/auth/login}': ['p(95)<1000'],
    'http_req_duration{name:GET /api/conversations}': ['p(95)<800'],
  },
};

export default function () {
  const accessToken = login();

  const conversationsRes = http.get(`${BASE_URL}/api/conversations`, {
    ...authHeaders(accessToken),
    tags: {
      name: 'GET /api/conversations',
    },
  });

  check(conversationsRes, {
    'get conversations status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
