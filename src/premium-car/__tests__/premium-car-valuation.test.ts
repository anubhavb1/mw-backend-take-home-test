import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { fetchValuationFromPremiumCarValuation } from '../premium-car-valuation';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { PremiumCarValuationResponse } from '../types/premium-car-valuation-response';

vi.mock('axios');
vi.mock('xml2js', () => ({
  parseStringPromise: vi.fn(),
}));

describe('fetchValuationFromPremiumCarValuation', () => {
  const vrm = 'ABC123';
  const mileage = 10000;

  const mockApiResponse = `
    <response>
      <valuation>
        <privateSaleMinimum>20000</privateSaleMinimum>
        <dealershipMinimum>22000</dealershipMinimum>
        <privateSaleMaximum>24000</privateSaleMaximum>
        <dealershipMaximum>26000</dealershipMaximum>
      </valuation>
      <registrationDate>2012-06-14</registrationDate>
      <registrationYear>2012</registrationYear>
      <registrationMonth>6</registrationMonth>
    </response>
  `;

  const parsedApiResponse: PremiumCarValuationResponse = {
    valuation: {
      privateSaleMinimum: 20000,
      dealershipMinimum: 22000,
      privateSaleMaximum: 24000,
      dealershipMaximum: 26000,
    },
    registrationDate: '2012-06-14',
    registrationYear: 2012,
    registrationMonth: 6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch valuation and return VehicleValuation object', async () => {
    
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockApiResponse });

    vi.mocked(parseStringPromise).mockResolvedValueOnce(parsedApiResponse);

    const result = await fetchValuationFromPremiumCarValuation(vrm, mileage);

    const expectedValuation = new VehicleValuation();
    expectedValuation.vrm = vrm;
    expectedValuation.lowestValue = 20000;
    expectedValuation.highestValue = 26000;
    expectedValuation.provider = 'Premium Car Valuations';

    expect(result).toEqual(expectedValuation);
    expect(axios.get).toHaveBeenCalledWith(`valuations/${vrm}?mileage=${mileage}`);
    expect(parseStringPromise).toHaveBeenCalledWith(mockApiResponse, { explicitArray: false });
  });

  it('should throw an error if axios.get fails', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    await expect(fetchValuationFromPremiumCarValuation(vrm, mileage)).rejects.toThrow('Network Error');
  });

  it('should throw an error if parseStringPromise fails', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockApiResponse });
    vi.mocked(parseStringPromise).mockRejectedValueOnce(new Error('Parsing Error'));

    await expect(fetchValuationFromPremiumCarValuation(vrm, mileage)).rejects.toThrow('Parsing Error');
  });
});
