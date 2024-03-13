import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlvideContraComponent } from './olvide-contra.component';

describe('OlvideContraComponent', () => {
  let component: OlvideContraComponent;
  let fixture: ComponentFixture<OlvideContraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OlvideContraComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OlvideContraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
