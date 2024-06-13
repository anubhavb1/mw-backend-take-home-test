import { beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { app } from '@app/app';

export let fastify: FastifyInstance;

beforeAll(async () => {
  fastify = await app();
  await fastify.ready();
});

afterAll(async () => {
  await fastify.close();
});
