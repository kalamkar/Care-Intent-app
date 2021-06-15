import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint, Message} from "../model/model";
// @ts-ignore
import {DateTime} from 'luxon';
import {GoogleChartInterface} from "ng2-google-charts/google-charts-interfaces";
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  private readonly MIN_STEPS_FOR_ANNOTATION = 1500;

  @ViewChild('chart') public chartComponent: AppGoogleChartComponent | undefined;

  private readonly routeSubscription: Subscription;
  private dataSubscription: Subscription | null = null;
  private messagesSubscription: Subscription | null = null;

  personId: string | null = null;

  chartData: GoogleChartInterface = {
    chartType: 'ComboChart',
    options: {
      height: 500,
      seriesType: 'line',
      series: {
        0: {targetAxisIndex: 0},
        1: {targetAxisIndex: 3, type: 'bars'}
      },
      vAxes: {
        0: {title: 'Glucose mg/dL'},
        3: {title: 'Steps', gridlines: {color: 'transparent'}, textPosition: 'none'}
      }
    },
    dataTable: []
  };

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,) {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.personId !== this.route.snapshot.paramMap.get('id')) {
          this.init();
        }
      }
    });
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.personId = this.route.snapshot.paramMap.get('id');
    if (!this.personId) {
      return;
    }

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    const names = ['glucose', 'steps'];
    this.dataSubscription = this.api.getData(this.personId, names).subscribe((data: DataPoint[]) => {
      if (!data || data.length === 0) {
        return;
      }
      this.chartData.dataTable = [];
      this.chartData.dataTable.push(['Time', 'Glucose', { role: 'annotation' }, { role: 'annotationText' },
        'Steps', { role: 'annotation' }]);
      const counts = {'Glucose': 0, 'Steps': 0};
      data.forEach(row => {
        if (row.name === 'glucose') {
          this.chartData.dataTable.push([DateTime.fromISO(row.time).toJSDate(), row.number, null, null, null, null]);
          counts['Glucose'] += 1;
        } else if (row.name === 'steps') {
          this.chartData.dataTable.push([DateTime.fromISO(row.time).toJSDate(), null, null, null, row.number,
            row.number && row.number > this.MIN_STEPS_FOR_ANNOTATION ? row.number.toString(): null]);
          counts['Steps'] += 1;
        }
      });
      if (!counts['Steps']) {
        this.chartData.dataTable[1][this.chartData.dataTable[0].indexOf('Steps')] = 0;
      } else if (!counts['Glucose']) {
        this.chartData.dataTable[1][1] = -1;
      }
      if (this.chartComponent && this.chartComponent.chartComponent) {
        this.chartComponent.chartComponent.draw();
      }

      if (this.messagesSubscription) {
        this.messagesSubscription.unsubscribe();
      }
      this.messagesSubscription = this.api.getMessages(this.personId || '').subscribe((messages: Message[]) => {
        if (!messages || messages.length === 0) {
          return;
        }
        let matchingTimes = Array<DateTime>(messages.length);
        let indices = Array<number>(messages.length);
        data.forEach((row, rowIndex) => {
          const rowTime = DateTime.fromISO(row.time);
          messages.forEach((message, msgIndex) => {
            const messageTime = DateTime.fromISO(message.time);
            if (!matchingTimes[msgIndex]
                || Math.abs(rowTime - messageTime) < Math.abs(matchingTimes[msgIndex] - messageTime)) {
              matchingTimes[msgIndex] = rowTime;
              indices[msgIndex] = rowIndex;
            }
          });
        });
        messages.forEach((message, index) => {
          let isFoodMessage = false;
          const foodTags = ['report.food', 'answer.food'];
          message.tags.forEach(tag => isFoodMessage = isFoodMessage || foodTags.indexOf(tag) >= 0);
          if (!isFoodMessage) {
            return;
          }
          this.chartData.dataTable[indices[index] + 1][2] = message.content.substr(0, 5) + '...';
          this.chartData.dataTable[indices[index] + 1][3] = message.content;
        });
        if (this.chartComponent && this.chartComponent.chartComponent) {
          this.chartComponent.chartComponent.draw();
        }
      });
    });
  }
}
