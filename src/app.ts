import './env';
import 'reflect-metadata';

import { fastify as Fastify, FastifyServerOptions } from 'fastify';
import { valuationRoutes } from './routes/valuation';
import { DataSource } from 'typeorm';
import { VehicleValuation } from './models/vehicle-valuation';
import { VehicleValuationRepository } from './repositories/vehicle-valuation-repository';


export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH!,
  synchronize: process.env.SYNC_DATABASE === 'true',
  logging: false,
  entities: [VehicleValuation],
  migrations: [],
  subscribers: [],
});

export const app = async (opts?: FastifyServerOptions) => {
  const fastify = Fastify(opts);

  await AppDataSource.initialize();
  const vehicleValuationRepository = AppDataSource.getRepository(VehicleValuation).extend(VehicleValuationRepository);

  fastify.decorate('vehicleValuationRepository', vehicleValuationRepository);

  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  valuationRoutes(fastify);

  return fastify;
};
