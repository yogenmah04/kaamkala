import { TestBed } from '@angular/core/testing';

import { DeskConfigService } from './desk-config.service';

describe('DeskConfigService', () => {
  let service: DeskConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeskConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
