import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficasPacienteComponent } from './graficas-paciente.component';

describe('GraficasPacienteComponent', () => {
  let component: GraficasPacienteComponent;
  let fixture: ComponentFixture<GraficasPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraficasPacienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GraficasPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
