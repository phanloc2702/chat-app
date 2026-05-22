import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { login } from '../helpers/auth.helper.js';
import { authHeaders } from '../helpers/http.helper.js';

export const options = {
  scenarios: {
    chat_read_flow: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],

    'http_req_duration{name:POST /api/auth/login}': ['p(95)<1000'],
    'http_req_duration{name:GET /api/conversations}': ['p(95)<800'],
    'http_req_duration{name:GET /api/messages/:conversationId}': ['p(95)<800'],
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
    'has conversations': (r) =>
      Array.isArray(r.json('data')) && r.json('data').length > 0,
  });

  const conversationId = conversationsRes.json('data.0.id');

  const messagesRes = http.get(`${BASE_URL}/api/messages/${conversationId}`, {
    ...authHeaders(accessToken),
    tags: {
      name: 'GET /api/messages/:conversationId',
    },
  });

  check(messagesRes, {
    'get messages status is 200': (r) => r.status === 200,
    'messages data is array': (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}
