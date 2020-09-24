import { TestBed } from '@angular/core/testing';

import { OpEventService } from './op-event.service';

describe('OpEventService', () => {
  let service: OpEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
