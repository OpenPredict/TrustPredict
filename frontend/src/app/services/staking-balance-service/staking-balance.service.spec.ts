import { TestBed } from '@angular/core/testing';

import { StakingBalanceService } from './staking-balance.service';

describe('StakingBalanceService', () => {
  let service: StakingBalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StakingBalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
