import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppGoogleChartComponent } from './app-google-chart.component';

describe('GoogleChartComponent', () => {
  let component: AppGoogleChartComponent;
  let fixture: ComponentFixture<AppGoogleChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppGoogleChartComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppGoogleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
