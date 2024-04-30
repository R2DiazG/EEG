import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaBandVisualizationComponent } from './area-band-visualization.component';

describe('AreaBandVisualizationComponent', () => {
  let component: AreaBandVisualizationComponent;
  let fixture: ComponentFixture<AreaBandVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AreaBandVisualizationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AreaBandVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
