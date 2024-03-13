import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AprobarPsicologosComponent } from './aprobar-psicologos.component';

describe('AprobarPsicologosComponent', () => {
  let component: AprobarPsicologosComponent;
  let fixture: ComponentFixture<AprobarPsicologosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AprobarPsicologosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AprobarPsicologosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
