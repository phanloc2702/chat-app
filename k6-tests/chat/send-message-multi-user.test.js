import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USERS } from '../config.js';
import { login } from '../helpers/auth.helper.js';
import { authHeaders } from '../helpers/http.helper.js';

export const options = {
  scenarios: {
    chat_write_multi_user_flow: {
      executor: 'ramping-vus',
      stages: [
        { duration: '5s', target: 2 },
        { duration: '10s', target: 2 },
        { duration: '5s', target: 0 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],

    'http_req_duration{name:POST /api/auth/login}': ['p(95)<1000'],
    'http_req_duration{name:GET /api/conversations}': ['p(95)<800'],
    'http_req_duration{name:POST /api/messages}': ['p(95)<1000'],
  },
};

function getUserByVu() {
  return TEST_USERS[(__VU - 1) % TEST_USERS.length];
}

export default function () {
  const selectedUser = getUserByVu();

  const accessToken = login(selectedUser);

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

  const payload = JSON.stringify({
    conversationId,
    content: `hello from ${selectedUser.email} vu=${__VU} iter=${__ITER}`,
  });

  const sendMessageRes = http.post(`${BASE_URL}/api/messages`, payload, {
    ...authHeaders(accessToken),
    headers: {
      ...authHeaders(accessToken).headers,
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'POST /api/messages',
    },
  });

  check(sendMessageRes, {
    'send message status is 200 or 201': (r) =>
      r.status === 200 || r.status === 201,
    'sent message has id': (r) => r.json('data.id') !== undefined,
    'sent message content exists': (r) => r.json('data.content') !== undefined,
  });

  sleep(1);
}