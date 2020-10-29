import { TestBed } from '@angular/core/testing';

import { OpBalanceService } from './op-balance.service';

describe('OpBalanceService', () => {
  let service: OpBalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpBalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
