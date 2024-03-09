import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPacienteComponent } from './info-paciente.component';

describe('InfoPacienteComponent', () => {
  let component: InfoPacienteComponent;
  let fixture: ComponentFixture<InfoPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InfoPacienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InfoPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
