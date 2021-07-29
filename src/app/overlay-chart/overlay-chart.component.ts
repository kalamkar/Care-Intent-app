import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint, Message} from "../model/model";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";
import {Utils} from "../utils";

@Component({
  selector: 'app-overlay-chart',
  templateUrl: './overlay-chart.component.html',
  styleUrls: ['./overlay-chart.component.scss']
})
export class OverlayChartComponent implements OnInit, OnChanges {

  private readonly MIN_MINUTES_FOR_ANNOTATION = 30;

  @Input() personId: string | undefined;
  @Input() end: DateTime | undefined;
  @Input() start: DateTime | undefined;
  @Input() height: number = 500;
  @Input() legend: boolean = false;
  @ViewChild('comboChart') public comboChart: AppGoogleChartComponent | undefined;

  private dataSubscription: Subscription | undefined;
  private messagesSubscription: Subscription | undefined;

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
        1: {type: 'line', lineWidth: 16},
        2: {type: 'scatter'},
        3: {type: 'scatter'},
        4: {type: 'scatter'}
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

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(): void {
    this.init();
  }

  init(): void {
    if (!this.personId || !this.start || !this.end) {
      return;
    }

    this.comboChartData.options.height = this.height;
    this.comboChartData.options.legend = {position: this.legend ? 'top' : 'none'};
    this.comboChartData.options.title = this.start.toFormat('LLL dd, EEEE');
    this.comboChartData.options.hAxis.minValue = this.start.toJSDate();
    this.comboChartData.options.hAxis.maxValue = this.end.toJSDate();

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.dataSubscription = this.api.getData(this.personId, ['glucose', 'steps', 'sys', 'dia'], this.start, this.end).subscribe(
        (data: DataPoint[]) => {
      if (!data || data.length === 0) {
        return;
      }
      this.comboChartData.dataTable = [];
      this.comboChartData.dataTable.push(['Time',
        'Glucose', { role: 'annotation' }, { role: 'annotationText' },
        'Activity', { role: 'annotation' },
        'Food', { role: 'annotation' }, { role: 'annotationText' },
        'BP Sys', 'BP Dia'
      ]);
      let missing = ['Glucose', 'Activity', 'BP Sys', 'BP Dia'];
      data.forEach(row => {
        const timestamp = DateTime.fromISO(row.time);
        if (row.name === 'glucose') {
          this.comboChartData.dataTable.push([timestamp.toJSDate(), row.number, null, null, null, null,
            null, null, null, null, null]);
          missing = missing.filter(value => value !== 'Glucose');
        } else if (row.name === 'steps') {
          const duration = Duration.fromMillis(row.duration * 1000);
          const startTime = DateTime.fromISO(row.time);
          const minutes = duration.as('minutes');
          const activityEndTime = startTime.plus(duration);
          const activityAnnotation = minutes > this.MIN_MINUTES_FOR_ANNOTATION
            ? minutes.toFixed().toString() + ' mins' : null;
          this.comboChartData.dataTable.push([startTime.toJSDate(), null, null, null, 10, activityAnnotation, null,
            null, null, null, null]);
          this.comboChartData.dataTable.push([activityEndTime.toJSDate(), null, null, null, 10, null, null, null, null,
            null, null]);
          missing = missing.filter(value => value !== 'Activity');
        } else if (row.name === 'sys') {
          this.comboChartData.dataTable.push([timestamp.toJSDate(), null, null, null, null, null, null, null, null,
            row.number, null]);
          missing = missing.filter(value => value !== 'BP Sys');
        } else if (row.name === 'dia') {
          this.comboChartData.dataTable.push([timestamp.toJSDate(), null, null, null, null, null, null, null, null,
            null, row.number]);
          missing = missing.filter(value => value !== 'BP Dia');
        }
      });
      missing.forEach(value => {
        this.comboChartData.dataTable[1][this.comboChartData.dataTable[0].indexOf(value)] = -1;
      });
      // missing.forEach(value => {
      //   this.comboChartData.dataTable =
      //     Utils.removeColumn(this.comboChartData.dataTable[0].indexOf(value), this.comboChartData.dataTable);
      // });
      if (this.comboChart && this.comboChart.chartComponent) {
        this.comboChart.reDrawChart();
      }

      if (this.messagesSubscription) {
        this.messagesSubscription.unsubscribe();
      }
      this.messagesSubscription = this.api.getMessages(this.personId || '', this.start, this.end).subscribe(
          (messages: Message[]) => {
        if (!messages) {
          this.comboChartData.dataTable[1][this.comboChartData.dataTable[0].indexOf('Food')] = 0;
          return;
        }
        let hasMessages = false;
        const foodMessages = messages.filter(message => {
          let isFoodMessage = false;
          message.tags.forEach(tag => isFoodMessage = isFoodMessage || tag === 'food.report');
          return isFoodMessage;
        });
        let otherRows = 0;
        let prevMessage: {time: null|DateTime, content: null|string} = {time: null, content: null};
        data.forEach((row, rowIndex) => {
          if (row.name !== 'glucose') {
            otherRows++;
            return
          }
          const rowTime = DateTime.fromISO(row.time);
          foodMessages.forEach(message => {
            const messageTime = DateTime.fromISO(message.time).minus(Duration.fromMillis(3 * 60 * 60 * 1000));
            const diff = rowTime.diff(messageTime).as('minutes');
            if (diff < 0 || 5 <= diff) {
              return
            }
            if (prevMessage.time != null && Math.abs(prevMessage.time.diff(messageTime).as('minutes')) < 60) {
              prevMessage.content += ' + ' + message.content;
              this.comboChartData.dataTable[this.comboChartData.dataTable.length - 1][7] = prevMessage.content;
              this.comboChartData.dataTable[this.comboChartData.dataTable.length - 1][8] = prevMessage.content;
            } else {
              const value = this.comboChartData.dataTable[rowIndex + otherRows + 1][1];
              this.comboChartData.dataTable.push([rowTime.toJSDate(), null, null, null, null, null, value,
                message.content, message.content, null, null]);
              prevMessage = {time: messageTime, content: message.content};
              hasMessages = true;
            }
          });
        });
        if (!hasMessages) {
          this.comboChartData.dataTable[1][this.comboChartData.dataTable[0].indexOf('Food')] = 0;
        }
        if (this.comboChart && this.comboChart.chartComponent) {
          this.comboChart.reDrawChart();
        }
      });
    });
  }
}
