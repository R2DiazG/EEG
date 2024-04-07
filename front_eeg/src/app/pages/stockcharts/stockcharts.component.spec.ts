import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockchartsComponent } from './stockcharts.component';

describe('StockchartsComponent', () => {
  let component: StockchartsComponent;
  let fixture: ComponentFixture<StockchartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockchartsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockchartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
