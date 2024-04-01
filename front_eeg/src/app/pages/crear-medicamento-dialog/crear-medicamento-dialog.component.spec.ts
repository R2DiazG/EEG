import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearMedicamentoDialogComponent } from './crear-medicamento-dialog.component';

describe('CrearMedicamentoDialogComponent', () => {
  let component: CrearMedicamentoDialogComponent;
  let fixture: ComponentFixture<CrearMedicamentoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CrearMedicamentoDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CrearMedicamentoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
