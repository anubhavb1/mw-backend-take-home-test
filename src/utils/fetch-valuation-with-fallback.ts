import { fetchValuationFromSuperCarValuation } from '@app/super-car/super-car-valuation';
import { fetchValuationFromPremiumCarValuation } from '@app/premium-car/premium-car-valuation';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { saveLog } from './save-log';

const SUPER_CAR_PROVIDER = 'SuperCar Valuations';
const PREMIUM_CAR_PROVIDER = 'Premium Car Valuations';
const FAILURE_THRESHOLD = 0.5; // 50%
const REVERT_TIME = 60000; // 60 seconds

class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
  }

  recordSuccess() {
    this.successCount++;
    if (this.failureRatio <= FAILURE_THRESHOLD) {
      setTimeout(() => this.reset(), REVERT_TIME);
    }
  }

  recordFailure() {
    this.failureCount++;
  }

  get failureRatio() {
    return this.failureCount / (this.failureCount + this.successCount);
  }

  get isOpen() {
    return this.failureRatio > FAILURE_THRESHOLD;
  }
}

const circuitBreaker = new CircuitBreaker();

export function __resetCircuitBreakerForTests() {
  circuitBreaker.reset();
}

async function logValuationAttempt(vrm: string, provider: string, startTime: Date, statusCode: number, errorCode?: string, errorMessage?: string) {
  await saveLog(vrm, provider, startTime, statusCode, errorCode, errorMessage);
}

export async function fetchValuationWithFallback(vrm: string, mileage: number): Promise<VehicleValuation> {
  const startTime = new Date();
  try {
    const response = await fetchValuationFromSuperCarValuation(vrm, mileage);
    circuitBreaker.recordSuccess();
    await logValuationAttempt(vrm, SUPER_CAR_PROVIDER, startTime, 200);
    return response;
  } catch (error) {
    circuitBreaker.recordFailure();
    if (circuitBreaker.isOpen) {
      try {
        const response = await fetchValuationFromPremiumCarValuation(vrm, mileage);
        await logValuationAttempt(vrm, PREMIUM_CAR_PROVIDER, startTime, 200);
        return response;
      } catch (error) {
        await logValuationAttempt(vrm, PREMIUM_CAR_PROVIDER, startTime, 503, '503', 'Service Unavailable');
        throw new Error('503 Service Unavailable');
      }
    } else {
      await logValuationAttempt(vrm, SUPER_CAR_PROVIDER, startTime, 503, '503', 'Service Unavailable');
      throw new Error('503 Service Unavailable');
    }
  }
}
