import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRegistraPsicologoComponent } from './admin-registra-psicologo.component';

describe('AdminRegistraPsicologoComponent', () => {
  let component: AdminRegistraPsicologoComponent;
  let fixture: ComponentFixture<AdminRegistraPsicologoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminRegistraPsicologoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminRegistraPsicologoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
