import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import { fetchValuationWithFallback } from '@app/utils/fetch-valuation-with-fallback';

export function valuationRoutes(fastify: FastifyInstance) {
  fastify.decorate('fetchValuationWithFallback', fetchValuationWithFallback);
  
  fastify.get<{
    Params: { vrm: string };
  }>('/valuations/:vrm', getValuationHandler);

  fastify.put<{
    Body: VehicleValuationRequest;
    Params: { vrm: string };
  }>('/valuations/:vrm', putValuationHandler);
}

export async function getValuationHandler(
  request: FastifyRequest<{ Params: { vrm: string } }>,
  reply: FastifyReply
) {
  const { vrm } = request.params;

  if (!vrm || vrm.length > 7) {
    return reply.code(400).send({ message: 'VRM must be 7 characters or less', statusCode: 400 });
  }

  try {
    const result = await request.server.vehicleValuationRepository.findByVrm(vrm);

    if (!result) {
      return reply.code(404).send({ message: `Valuation for VRM ${vrm} not found`, statusCode: 404 });
    }

    return result;
  } catch (error) {
    request.server.log.error('Error retrieving valuation:', error);
    return reply.code(500).send({ message: 'Internal Server Error', statusCode: 500 });
  }
}

export async function putValuationHandler(
  request: FastifyRequest<{ Body: VehicleValuationRequest; Params: { vrm: string } }>,
  reply: FastifyReply
) {
  const { vrm } = request.params;
  const { mileage } = request.body;

  if (vrm.length > 7) {
    return reply.code(400).send({ message: 'VRM must be 7 characters or less', statusCode: 400 });
  }

  if (!mileage || mileage <= 0) {
    return reply.code(400).send({ message: 'Mileage must be a positive number', statusCode: 400 });
  }

  try {
    let valuation = await request.server.vehicleValuationRepository.findByVrm(vrm);

    if (!valuation) {
      valuation = await request.server.fetchValuationWithFallback(vrm, mileage);

      try {
        await request.server.vehicleValuationRepository.insert(valuation);
      } catch (err: any) {
        if (err.code !== 'SQLITE_CONSTRAINT') {
          throw err;
        }
      }
    }

    request.server.log.info('Valuation created: ', valuation);
    return valuation;
  } catch (error) {
    request.server.log.error('Error creating valuation:', error);
    return reply.code(503).send({ message: 'Service Unavailable', statusCode: 503 });
  }
}
