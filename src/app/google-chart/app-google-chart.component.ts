import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ChartErrorEvent, ChartReadyEvent, GoogleChartComponent } from 'ng2-google-charts';
import { GoogleChartInterface } from 'ng2-google-charts/google-charts-interfaces';


@Component({
  selector: 'app-google-chart',
  templateUrl: './app-google-chart.component.html',
  styleUrls: ['./app-google-chart.component.css']
})
export class AppGoogleChartComponent implements OnInit, OnChanges {

  @Input() data: GoogleChartInterface;
  @Input() customErrorMsg: string | null = null;
  chartReady: EventEmitter<ChartReadyEvent> = new EventEmitter<ChartReadyEvent>();
  chartError: EventEmitter<ChartErrorEvent> = new EventEmitter<ChartErrorEvent>();
  chartErrorMsg: string | null = null;
  @ViewChild('chart', {static: true}) public chartComponent: GoogleChartComponent | undefined;
  private isReady = false;
  private resizeTimeout: any;

  private static getCoords(chart: any) {
    if (!chart) {
      return null;
    }
    const chartLayout = chart.getChartLayoutInterface();
    const chartBounds = chartLayout.getChartAreaBoundingBox();
    return {
      x: {
        min: chartLayout.getHAxisValue(chartBounds.left),
        max: chartLayout.getHAxisValue(chartBounds.width + chartBounds.left)
      },
      y: {
        min: chartLayout.getVAxisValue(chartBounds.top),
        max: chartLayout.getVAxisValue(chartBounds.height + chartBounds.top)
      }
    };
  }

  private static setRange(coords: any, chart: GoogleChartComponent, data: GoogleChartInterface) {
    const chartOptions = data.options;
    // @ts-ignore
    if (chartOptions.hAxis) {
      // @ts-ignore
      chartOptions.hAxis['viewWindow'] = {};
      if (coords) {
        // @ts-ignore
        chartOptions.hAxis['viewWindow'].min = coords.x.min;
        // @ts-ignore
        chartOptions.hAxis['viewWindow'].max = coords.x.max;
      }
    }
    // @ts-ignore
    if (chartOptions.vAxis) {
      // @ts-ignore
      chartOptions.vAxis['viewWindow'] = {};
      if (coords) {
        // @ts-ignore
        chartOptions.vAxis['viewWindow'].min = coords.y.min;
        // @ts-ignore
        chartOptions.vAxis['viewWindow'].max = coords.y.max;
      }
    }
    // @ts-ignore
    chart.draw(data.dataTable, chartOptions);
  }

  @HostListener('window:resize')
  onWindowResize() {
    // debounce resize, wait for resize to finish before doing stuff
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout((() => {
      this.reDrawChart();
    }).bind(this), 500);
  }

  constructor() {
    this.data = {
      chartType: '',
      options: {},
      dataTable: []};
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isReady && this.data) {
      this.resetZoom();
    }
  }

  onChartReady(chart: any, event: any) {
    this.chartErrorMsg = null;
    if (!this.isReady) {
      this.isReady = true;
      this.onWindowResize();
    }
    this.chartReady.emit(event);
  }

  onChartError(event: any): void {
    this.chartErrorMsg = event.message;
    this.isReady = false;
    this.chartError.emit(event);
  }

  reDrawChart() {
    if (this.chartComponent && this.data) {
      let coords;
      if (this.isReady && this.data.chartType !== 'Table') {
        coords = AppGoogleChartComponent.getCoords(this.chartComponent.wrapper.getChart());
      }
      AppGoogleChartComponent.setRange(coords, this.chartComponent, this.data);
    }
  }

  resetZoom() {
    if (this.chartComponent && this.data) {
      AppGoogleChartComponent.setRange(null, this.chartComponent, this.data);
    }
  }
}
