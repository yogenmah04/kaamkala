import { TestBed } from '@angular/core/testing';

import { DarazConfigService } from './daraz-config.service';

describe('DarazConfigService', () => {
  let service: DarazConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DarazConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
