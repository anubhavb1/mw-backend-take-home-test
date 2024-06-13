import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchValuationWithFallback, __resetCircuitBreakerForTests } from '../fetch-valuation-with-fallback';
import { fetchValuationFromSuperCarValuation } from '@app/super-car/super-car-valuation';
import { fetchValuationFromPremiumCarValuation } from '@app/premium-car/premium-car-valuation';
import { saveLog } from '../save-log';
import { VehicleValuation } from '@app/models/vehicle-valuation';

vi.mock('@app/super-car/super-car-valuation', () => ({
  fetchValuationFromSuperCarValuation: vi.fn(),
}));

vi.mock('@app/premium-car/premium-car-valuation', () => ({
  fetchValuationFromPremiumCarValuation: vi.fn(),
}));

vi.mock('../save-log', () => ({
  saveLog: vi.fn(),
}));

describe('fetchValuationWithFallback', () => {
  const vrm = 'ABC123';
  const mileage = 10000;
  const superCarValuation: VehicleValuation = {
    vrm,
    lowestValue: 22350,
    highestValue: 24750,
    provider: 'SuperCar Valuations',
    get midpointValue() {
      return (this.highestValue + this.lowestValue) / 2;
    },
  };
  const premiumCarValuation: VehicleValuation = {
    vrm,
    lowestValue: 20000,
    highestValue: 22000,
    provider: 'Premium Car Valuations',
    get midpointValue() {
      return (this.highestValue + this.lowestValue) / 2;
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    __resetCircuitBreakerForTests();
  });

  it('should return SuperCar valuation when successful', async () => {
    vi.mocked(fetchValuationFromSuperCarValuation).mockResolvedValue(superCarValuation);

    const result = await fetchValuationWithFallback(vrm, mileage);

    expect(result).toEqual(superCarValuation);
    expect(fetchValuationFromSuperCarValuation).toHaveBeenCalledWith(vrm, mileage);
    expect(fetchValuationFromPremiumCarValuation).not.toHaveBeenCalled();
    expect(saveLog).toHaveBeenCalledWith(vrm, 'SuperCar Valuations', expect.any(Date), 200, undefined, undefined);
  });

  it('should fall back to PremiumCar valuation after SuperCar failure', async () => {
    vi.mocked(fetchValuationFromSuperCarValuation).mockRejectedValue(new Error('Failed'));
    vi.mocked(fetchValuationFromPremiumCarValuation).mockResolvedValue(premiumCarValuation);

    const result = await fetchValuationWithFallback(vrm, mileage);

    console.log('Mocked fetchValuationFromSuperCarValuation calls:', vi.mocked(fetchValuationFromSuperCarValuation).mock.calls);
    console.log('Mocked fetchValuationFromPremiumCarValuation calls:', vi.mocked(fetchValuationFromPremiumCarValuation).mock.calls);
    console.log('Result:', result);

    expect(result).toEqual(premiumCarValuation);
    expect(fetchValuationFromSuperCarValuation).toHaveBeenCalledWith(vrm, mileage);
    expect(fetchValuationFromPremiumCarValuation).toHaveBeenCalledWith(vrm, mileage);
    expect(saveLog).toHaveBeenCalledWith(vrm, 'Premium Car Valuations', expect.any(Date), 200, undefined, undefined);
  });

  it('should throw error if both valuations fail', async () => {
    vi.mocked(fetchValuationFromSuperCarValuation).mockRejectedValue(new Error('Failed'));
    vi.mocked(fetchValuationFromPremiumCarValuation).mockRejectedValue(new Error('503 Service Unavailable'));

    await expect(fetchValuationWithFallback(vrm, mileage)).rejects.toThrow('503 Service Unavailable');

    expect(fetchValuationFromSuperCarValuation).toHaveBeenCalledWith(vrm, mileage);
    expect(fetchValuationFromPremiumCarValuation).toHaveBeenCalledWith(vrm, mileage);
    expect(saveLog).toHaveBeenCalledWith(vrm, 'Premium Car Valuations', expect.any(Date), 503, '503', 'Service Unavailable');
  });

  it('should not fall back to PremiumCar valuation if failure threshold is not exceeded', async () => {
    vi.mocked(fetchValuationFromSuperCarValuation)
      .mockResolvedValueOnce(superCarValuation)
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce(superCarValuation);

    await fetchValuationWithFallback(vrm, mileage);
    await expect(fetchValuationWithFallback(vrm, mileage)).rejects.toThrow('503 Service Unavailable');
    const result = await fetchValuationWithFallback(vrm, mileage);

    expect(result).toEqual(superCarValuation);
    expect(fetchValuationFromSuperCarValuation).toHaveBeenCalledTimes(3);
    expect(fetchValuationFromPremiumCarValuation).not.toHaveBeenCalled();
  });

  it('should log SuperCar valuation attempts correctly', async () => {
    vi.mocked(fetchValuationFromSuperCarValuation).mockResolvedValue(superCarValuation);

    await fetchValuationWithFallback(vrm, mileage);

    expect(saveLog).toHaveBeenCalledWith(vrm, 'SuperCar Valuations', expect.any(Date), 200, undefined, undefined);
  });
});
