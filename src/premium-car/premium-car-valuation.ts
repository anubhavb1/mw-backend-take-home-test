import axios from 'axios';
import { parseStringPromise } from 'xml2js';

import { VehicleValuation } from '../models/vehicle-valuation';
import { PremiumCarValuationResponse } from './types/premium-car-valuation-response';

export async function fetchValuationFromPremiumCarValuation(
  vrm: string,
  mileage: number,
): Promise<VehicleValuation> {
  axios.defaults.baseURL =
    'https://run.mocky.io/v3/0dfda26a-3a5a-43e5-b68c-51f148eda473';
  const response = await axios.get(`valuations/${vrm}?mileage=${mileage}`);
  const data: PremiumCarValuationResponse = await parseStringPromise(response.data, { explicitArray: false });

  const valuation = new VehicleValuation();
  valuation.vrm = vrm;
  valuation.lowestValue = Math.min(
    data.valuation.privateSaleMinimum,
    data.valuation.dealershipMinimum
  );
  valuation.highestValue = Math.max(
    data.valuation.privateSaleMaximum,
    data.valuation.dealershipMaximum
  );
  valuation.provider = 'Premium Car Valuations';// hardcoded value for the new provider attribute

  return valuation;
}
