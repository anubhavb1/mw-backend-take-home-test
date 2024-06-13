import { DataSource, Repository } from 'typeorm';
import { VehicleValuation } from '../models/vehicle-valuation';

export class VehicleValuationRepository extends Repository<VehicleValuation> {
  async findByVrm(vrm: string): Promise<VehicleValuation | null> {
    return await this.findOne({ where: { vrm } });
  }
}

export const createVehicleValuationRepository = (dataSource: DataSource) => {
  console.log('createVehicleValuationRepository called');
  const baseRepository = dataSource.getRepository(VehicleValuation);
  console.log('baseRepository:', baseRepository);
  const repo = new VehicleValuationRepository(baseRepository.target, baseRepository.manager, baseRepository.queryRunner);
  console.log('Created repo:', repo);
  return repo;
};
