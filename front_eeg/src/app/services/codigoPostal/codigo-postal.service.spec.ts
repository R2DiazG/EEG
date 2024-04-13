import { TestBed } from '@angular/core/testing';

import { CodigoPostalService } from './codigo-postal.service';

describe('CodigoPostalService', () => {
  let service: CodigoPostalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodigoPostalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
