import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint, Message} from "../model/model";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";

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
        2: {type: 'scatter'}
      },
      hAxis: {
        format: 'ha',
        textStyle: {
          fontSize: 12,
          color: 'gray'
        },
        gridlines: {color: 'transparent'},
        minorGridlines: {count: 0}
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

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.dataSubscription = this.api.getData(this.personId, ['glucose', 'steps'], this.start, this.end).subscribe(
        (data: DataPoint[]) => {
      if (!data || data.length === 0) {
        return;
      }
      this.comboChartData.dataTable = [];
      this.comboChartData.dataTable.push(['Time',
        'Glucose', { role: 'annotation' }, { role: 'annotationText' },
        'Activity', { role: 'annotation' },
        'Food', { role: 'annotation' }, { role: 'annotationText' }]);
      const counts = {'Glucose': 0, 'Activity': 0};
      data.forEach(row => {
        if (row.name === 'glucose') {
          const timestamp = DateTime.fromISO(row.time);
          this.comboChartData.dataTable.push([timestamp.toJSDate(), row.number, null, null, null, null,
            null, null, null]);
          counts['Glucose'] += 1;
        } else if (row.name === 'steps') {
          const duration = Duration.fromMillis(row.duration * 1000);
          const startTime = DateTime.fromISO(row.time);
          const minutes = duration.as('minutes');
          const activityEndTime = startTime.plus(duration);
          const activityAnnotation = minutes > this.MIN_MINUTES_FOR_ANNOTATION ? minutes.toFixed().toString() + ' mins' : null;
          this.comboChartData.dataTable.push([startTime.toJSDate(), null, null, null, 10, activityAnnotation, null, null, null]);
          this.comboChartData.dataTable.push([activityEndTime.toJSDate(), null, null, null, 10, null, null, null, null]);
          counts['Activity'] += 1;
        }
      });
      if (!counts['Activity']) {
        this.comboChartData.dataTable[1][this.comboChartData.dataTable[0].indexOf('Activity')] = 0;
      } else if (!counts['Glucose']) {
        this.comboChartData.dataTable[1][this.comboChartData.dataTable[0].indexOf('Glucose')] = -1;
      }
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
                message.content, message.content]);
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
