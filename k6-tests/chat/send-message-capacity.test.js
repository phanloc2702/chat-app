import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { BASE_URL } from '../config.js';
import { authHeaders } from '../helpers/http.helper.js';

const TARGET_VUS = Number(__ENV.TARGET_VUS || 2200);

const conversations = new SharedArray('k6 conversations', function () {
  return JSON.parse(open('../data/k6-conversations.json'));
});

export const options = {
  scenarios: {
    send_message_capacity: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: TARGET_VUS },
        { duration: '2m', target: TARGET_VUS },
        { duration: '1m', target: 0 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const sessions = [];

  for (const item of conversations) {
    sessions.push({
      email: item.user1.email,
      token: item.user1.accessToken,
      conversationId: item.conversationId,
    });

    sessions.push({
      email: item.user2.email,
      token: item.user2.accessToken,
      conversationId: item.conversationId,
    });
  }

  return {
    sessions,
  };
}

export default function (data) {
  const sessions = data.sessions;

  const sessionIndex = (__VU - 1) % sessions.length;
  const session = sessions[sessionIndex];

  const payload = JSON.stringify({
    conversationId: session.conversationId,
    content: `capacity test from ${session.email} vu=${__VU} iter=${__ITER}`,
  });

  const res = http.post(`${BASE_URL}/api/messages`, payload, {
    ...authHeaders(session.token),
    headers: {
      ...authHeaders(session.token).headers,
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'POST /api/messages',
    },
  });

  if (res.status !== 200 && res.status !== 201) {
    if (__VU <= 10 && __ITER < 10) {
      console.error(
        `SEND_FAILED status=${res.status} error=${res.error || 'none'} vu=${__VU} iter=${__ITER} body=${res.body}`
      );
    }
  }

  check(res, {
    'send message status is 200 or 201': (r) =>
      r.status === 200 || r.status === 201,

    'send message has id': (r) => {
      if (r.status !== 200 && r.status !== 201) {
        return false;
      }

      try {
        return r.json('data.id') !== undefined;
      } catch (error) {
        return false;
      }
    },
  });

  sleep(1);
}