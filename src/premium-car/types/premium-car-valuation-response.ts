import { PremiumCarValuation } from './premium-car-valuation';

export type PremiumCarValuationResponse = {
  registrationDate: string;
  registrationYear: number;
  registrationMonth: number;
  valuation: PremiumCarValuation;
};