import 'fastify';
import { VehicleValuationRepository } from './repositories/VehicleValuationRepository';

declare module 'fastify' {
  interface FastifyInstance {
    fetchValuationWithFallback: (vrm: string, mileage: number) => Promise<VehicleValuation>;
    vehicleValuationRepository: VehicleValuationRepository;
  }
}
