import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropMedicamentosDialogComponent } from './drop-medicamentos-dialog.component';

describe('DropMedicamentosDialogComponent', () => {
  let component: DropMedicamentosDialogComponent;
  let fixture: ComponentFixture<DropMedicamentosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DropMedicamentosDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DropMedicamentosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
