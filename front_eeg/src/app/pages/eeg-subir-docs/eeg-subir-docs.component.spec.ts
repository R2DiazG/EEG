import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EegSubirDocsComponent } from './eeg-subir-docs.component';

describe('EegSubirDocsComponent', () => {
  let component: EegSubirDocsComponent;
  let fixture: ComponentFixture<EegSubirDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EegSubirDocsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EegSubirDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
