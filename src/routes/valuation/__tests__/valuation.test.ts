import { fastify as Fastify, FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';
import axios from 'axios';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { valuationRoutes } from '@app/routes/valuation';
import { fetchValuationWithFallback } from '@app/utils/fetch-valuation-with-fallback';


vi.mock('axios');
vi.mock('@app/utils/fetch-valuation-with-fallback');

const mockedAxios = vi.mocked(axios, true);
const mockedFetchValuationWithFallback = vi.mocked(fetchValuationWithFallback, true);

// Create a mock repository class
class MockVehicleValuationRepository {
  findByVrm = vi.fn().mockResolvedValue(null);
  insert = vi.fn().mockResolvedValue({
    identifiers: [{ id: 1 }],
    generatedMaps: [],
    raw: []
  });
}

describe('ValuationController (e2e)', () => {
  let fastify: FastifyInstance;
  let valuationRepository: MockVehicleValuationRepository;

  beforeEach(async () => {
    fastify = Fastify();

    valuationRepository = new MockVehicleValuationRepository();

    fastify.decorate('vehicleValuationRepository', valuationRepository);

    valuationRoutes(fastify);

    await fastify.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fastify.close();
  });

  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      mockedFetchValuationWithFallback.mockResolvedValueOnce({
        vrm: 'ABC123',
        lowestValue: 22350,
        highestValue: 24750,
        provider: 'SuperCar Valuations'
      } as VehicleValuation);

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(res.json()).toEqual({
        vrm: 'ABC123',
        lowestValue: 22350,
        highestValue: 24750,
        provider: 'SuperCar Valuations'
      });
    });
    it('should return 503 if insert throws a non-SQLITE_CONSTRAINT error', async () => {
      mockedFetchValuationWithFallback.mockResolvedValue({
        vrm: 'ABC123',
        lowestValue: 22350,
        highestValue: 24750,
        provider: 'SuperCar Valuations',
        get midpointValue() {
          return (this.lowestValue + this.highestValue) / 2;
        },
      } as VehicleValuation);
      
      valuationRepository.insert.mockRejectedValue(new Error('Some error'));

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(503);
      expect(res.json()).toEqual({
        message: 'Service Unavailable',
        statusCode: 503,
      });
    });
  });

  describe('GET /valuations/:vrm', () => {
    it('should return 400 if VRM is missing or more than 7 characters', async () => {
      const res = await fastify.inject({
        url: '/valuations/',
        method: 'GET',
      });
  
      expect(res.statusCode).toStrictEqual(400);
      expect(res.json()).toEqual({
        message: 'VRM must be 7 characters or less',
        statusCode: 400,
      });
  
      const longVrmRes = await fastify.inject({
        url: '/valuations/12345678',
        method: 'GET',
      });
  
      expect(longVrmRes.statusCode).toStrictEqual(400);
      expect(longVrmRes.json()).toEqual({
        message: 'VRM must be 7 characters or less',
        statusCode: 400,
      });
    });
  
    it('should return 404 if VRM is not found', async () => {
      valuationRepository.findByVrm.mockResolvedValueOnce(null);
  
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });
  
      expect(res.statusCode).toStrictEqual(404);
      expect(res.json()).toEqual({
        message: 'Valuation for VRM ABC123 not found',
        statusCode: 404,
      });
    });

    it('should return 404 if VRM is not found', async () => {
      valuationRepository.findByVrm.mockResolvedValueOnce(null);

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(404);
      expect(res.json()).toEqual({
        message: 'Valuation for VRM ABC123 not found',
        statusCode: 404,
      });
    });
  
    it('should return 200 with valid VRM', async () => {
      const vehicleValuation: VehicleValuation = {
        vrm: 'ABC123',
        lowestValue: 22350,
        highestValue: 24750,
        provider: 'SuperCar Valuations',
        get midpointValue() {
          return (this.highestValue + this.lowestValue) / 2;
        },
      };
      valuationRepository.findByVrm.mockResolvedValueOnce(vehicleValuation);
  
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });
  
      expect(res.statusCode).toStrictEqual(200);
      expect(res.json()).toEqual(vehicleValuation);
    });
  
    it('should return 500 if there is an internal server error', async () => {
      valuationRepository.findByVrm.mockRejectedValueOnce(new Error('Internal Server Error'));
  
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });
  
      expect(res.statusCode).toStrictEqual(500);
      expect(res.json()).toEqual({
        message: 'Internal Server Error',
        statusCode: 500,
      });
    });
  });
});
