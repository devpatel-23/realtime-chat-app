import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase, closeDatabase } from '../src/db/index.js';

describe('REST API Endpoints', () => {
  let app: any;

  beforeAll(() => {
    // Use in-memory SQLite for testing
    getDatabase(':memory:');
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.uptime).toBeDefined();
    });
  });

  describe('POST /api/login', () => {
    it('should succeed with valid username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: 'alice' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('alice');
    });

    it('should reject empty username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should reject invalid characters in username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: '<script>alert(1)</script>' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/messages & GET /api/messages', () => {
    it('should create and persist a new message', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ username: 'alice', text: 'Hello, World!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.username).toBe('alice');
      expect(res.body.data.text).toBe('Hello, World!');
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('should sanitize message content', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ username: 'bob', text: '<b>Bold</b> & "quotes"' });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt; &amp; &quot;quotes&quot;');
    });

    it('should reject empty text message', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ username: 'alice', text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject message over 1000 characters', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ username: 'alice', text: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve message history oldest to newest', async () => {
      // Add another message
      await request(app)
        .post('/api/messages')
        .send({ username: 'charlie', text: 'Third message' });

      const res = await request(app).get('/api/messages?limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify oldest to newest order
      const messages = res.body.data;
      for (let i = 0; i < messages.length - 1; i++) {
        const t1 = new Date(messages[i].createdAt).getTime();
        const t2 = new Date(messages[i + 1].createdAt).getTime();
        expect(t1).toBeLessThanOrEqual(t2);
      }
    });

    it('should support pagination with limit and before', async () => {
      const res1 = await request(app).get('/api/messages?limit=1');
      expect(res1.body.data.length).toBe(1);

      const latestMsg = res1.body.data[0];
      const res2 = await request(app).get(`/api/messages?limit=5&before=${encodeURIComponent(latestMsg.createdAt)}`);
      expect(res2.status).toBe(200);
      expect(Array.isArray(res2.body.data)).toBe(true);
    });
  });

  describe('GET /api/users/online', () => {
    it('should return online users array and count', async () => {
      const res = await request(app).get('/api/users/online');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(typeof res.body.data.count).toBe('number');
    });
  });
});
