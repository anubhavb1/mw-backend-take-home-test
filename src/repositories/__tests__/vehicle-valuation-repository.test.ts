import { DataSource, Repository } from 'typeorm';
import { VehicleValuationRepository, createVehicleValuationRepository } from '../vehicle-valuation-repository';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { beforeEach, describe, expect, it, vi, Mock } from 'vitest';

vi.mock('../vehicle-valuation-repository', async () => {
  const actual = await vi.importActual<typeof import('../vehicle-valuation-repository')>('../vehicle-valuation-repository');
  return {
    ...actual,
    VehicleValuationRepository: vi.fn().mockImplementation(function (this: any, target: any, manager: any, queryRunner: any) {
      this.target = target;
      this.manager = manager;
      this.queryRunner = queryRunner;
      this.findOne = vi.fn();
      this.findByVrm = vi.fn();
    }),
  };
});

describe('VehicleValuationRepository', () => {
  let dataSource: DataSource;
  let repository: VehicleValuationRepository;
  let findOneMock: Mock;
  let findByVrmMock: Mock;

  beforeEach(() => {
    findOneMock = vi.fn();
    findByVrmMock = vi.fn();
    dataSource = {
      getRepository: vi.fn().mockReturnValue({
        target: VehicleValuation,
        manager: {},
        queryRunner: {},
        findOne: findOneMock,
      }),
    } as unknown as DataSource;

    repository = createVehicleValuationRepository(dataSource);
    repository.findByVrm = findByVrmMock;
  });

  it('should find a valuation by VRM', async () => {
    const mockValuation: VehicleValuation = {
      vrm: 'ABC123',
      lowestValue: 10000,
      highestValue: 15000,
      provider: 'SuperCar Valuations',
      get midpointValue() {
        return (this.highestValue + this.lowestValue) / 2;
      },
    };

    findByVrmMock.mockResolvedValue(mockValuation);

    const result = await repository.findByVrm('ABC123');

    expect(result).toEqual(mockValuation);
    expect(findByVrmMock).toHaveBeenCalledWith('ABC123');
  });

  it('should return null if VRM is not found', async () => {
    findByVrmMock.mockResolvedValue(null);

    const result = await repository.findByVrm('XYZ789');

    expect(result).toBeNull();
    expect(findByVrmMock).toHaveBeenCalledWith('XYZ789');
  });
});
