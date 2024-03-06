import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarPacienteComponent } from './registrar-paciente.component';

describe('RegistrarPacienteComponent', () => {
  let component: RegistrarPacienteComponent;
  let fixture: ComponentFixture<RegistrarPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrarPacienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistrarPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
