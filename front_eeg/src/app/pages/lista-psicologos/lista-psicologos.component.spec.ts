import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPsicologosComponent } from './lista-psicologos.component';

describe('ListaPsicologosComponent', () => {
  let component: ListaPsicologosComponent;
  let fixture: ComponentFixture<ListaPsicologosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaPsicologosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaPsicologosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
