import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayChartComponent } from './overlay-chart.component';

describe('OverlayChartComponent', () => {
  let component: OverlayChartComponent;
  let fixture: ComponentFixture<OverlayChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverlayChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
