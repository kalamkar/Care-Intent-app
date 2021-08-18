import {AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {DataPoint} from "../model/model";
import {ApiService} from "../services/api.service";
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";
import {FormControl, FormGroup} from "@angular/forms";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {Subscription} from "rxjs";
import {Utils} from "../utils";
import {MatDateRangeInput} from "@angular/material/datepicker";

@Component({
  selector: 'app-biomarkers',
  templateUrl: './biomarkers.component.html',
  styleUrls: ['./biomarkers.component.scss']
})
export class BiomarkersComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() personId: string | undefined;
  @ViewChild('comboChart') public comboChart: AppGoogleChartComponent | undefined;
  range = new FormGroup({
    start: new FormControl(DateTime.now().minus({days: 30}).toJSDate()),
    end: new FormControl(DateTime.now().toJSDate())
  });

  private dataSubscription: Subscription | undefined;

  comboChartData = {
    chartType: 'ComboChart',
    options: {
      title: null,
      legend: {position: 'top'},
      height: 500,
      annotations: {
        textStyle: {
          color: 'grey',
        },
        stem: {length: 20, color: 'red'}
      },
      series: {
        0: {type: 'line'},
        1: {type: 'line'},
        2: {type: 'line'}
      },
      hAxis: {
        format: 'ha',
        textStyle: {
          fontSize: 12,
          color: 'gray'
        },
        gridlines: {color: 'transparent'},
        minorGridlines: {count: 0},
        maxValue: 0,
        minValue: 0
      },
      vAxis: {
        gridlines: {color: 'transparent'},
        maxValue: 250,
        minValue: 0
      },
    },
    dataTable: new Array<any>()
  };

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.person) {
      this.init();
    }
  }

  dateRangeChange() {
    this.init();
  }

  init(): void {
    if (!this.personId || !this.range.value.start || !this.range.value.end) {
      return;
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.comboChartData.options.hAxis.minValue = this.range.value.start;
    this.comboChartData.options.hAxis.maxValue = this.range.value.end;

    this.dataSubscription = this.api.getData(this.personId, ['systolic', 'diastolic', 'pulse'],
          DateTime.fromJSDate(this.range.value.start), DateTime.fromJSDate(this.range.value.end).plus({days: 1})).subscribe(
      (data: DataPoint[]) => {
        this.comboChartData.dataTable = [];
        if (!data || data.length === 0) {
          if (this.comboChart && this.comboChart.chartComponent) {
            this.comboChart.reDrawChart();
          }
          return;
        }
        this.comboChartData.dataTable.push(['Time', 'BP Sys', 'BP Dia', 'Pulse']);
        let missing = ['BP Sys', 'BP Dia', 'Pulse'];
        data.forEach(row => {
          const timestamp = DateTime.fromISO(row.time);
          if (row.name === 'systolic') {
            this.comboChartData.dataTable.push([timestamp.toJSDate(), row.number, null, null]);
            missing = missing.filter(value => value !== 'BP Sys');
          } else if (row.name === 'diastolic') {
            this.comboChartData.dataTable.push([timestamp.toJSDate(), null, row.number, null]);
            missing = missing.filter(value => value !== 'BP Dia');
          } else if (row.name === 'pulse') {
            this.comboChartData.dataTable.push([timestamp.toJSDate(), null, null, row.number]);
            missing = missing.filter(value => value !== 'Pulse');
          }
        });
        missing.forEach(value => {
          this.comboChartData.dataTable =
            Utils.removeColumn(this.comboChartData.dataTable[0].indexOf(value), this.comboChartData.dataTable);
        });
        if (this.comboChart && this.comboChart.chartComponent) {
          this.comboChart.reDrawChart();
        }
      });
  }
}
