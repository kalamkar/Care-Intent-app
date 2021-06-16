import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint, Message} from "../model/model";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {GoogleChartInterface} from "ng2-google-charts/google-charts-interfaces";
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  private readonly MIN_STEPS_FOR_ANNOTATION = 1500;
  private readonly MIN_MINUTES_FOR_ANNOTATION = 30;
  private readonly MAX_MESSAGE_DIFF = Duration.fromMillis(5 * 60 * 1000);

  @ViewChild('chart') public chartComponent: AppGoogleChartComponent | undefined;

  private readonly routeSubscription: Subscription;
  private dataSubscription: Subscription | null = null;
  private messagesSubscription: Subscription | null = null;

  personId: string | null = null;

  chartData: GoogleChartInterface = {
    chartType: 'ComboChart',
    options: {
      height: 500,
      series: {
        0: {targetAxisIndex: 0, type: 'line'},
      },
      vAxes: {
        0: {title: 'Glucose mg/dL'},
      },
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
    this.dataSubscription = this.api.getData(this.personId, ['glucose', 'steps']).subscribe((data: DataPoint[]) => {
      if (!data || data.length === 0) {
        return;
      }
      this.chartData.dataTable = [];
      this.chartData.dataTable.push(['Time', 'Glucose', { role: 'annotation' }, { role: 'annotationText' },
        {role: 'emphasis'}]);
      let activityEndTime: DateTime;
      let activityAnnotation: string | null;
      data.forEach(row => {
        if (row.name === 'glucose') {
          const timestamp = DateTime.fromISO(row.time);
          const emphasis = activityEndTime && activityEndTime > timestamp;
          this.chartData.dataTable.push([timestamp.toJSDate(), row.number,
            emphasis && activityAnnotation ? activityAnnotation: null, null, emphasis]);
          activityAnnotation = null;
        } else if (row.name === 'steps') {
          const duration = Duration.fromMillis(row.duration * 1000);
          const startTime = DateTime.fromISO(row.time);
          const minutes = duration.as('minutes');
          activityEndTime = startTime.plus(duration);
          activityAnnotation = minutes > this.MIN_MINUTES_FOR_ANNOTATION ? minutes.toFixed().toString() + ' mins' : null;
        }
      });
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
        let indices = Array<number>(messages.length);
        let stepsRows = 0;
        data.forEach((row, rowIndex) => {
          const rowTime = DateTime.fromISO(row.time);
          if (row.name === 'steps') {
            stepsRows++;
          }
          messages.forEach((message, msgIndex) => {
            const messageTime = DateTime.fromISO(message.time).minus(Duration.fromMillis(3 * 60 * 60 * 1000));
            if (Math.abs(rowTime.diff(messageTime)) < this.MAX_MESSAGE_DIFF) {
              indices[msgIndex] = rowIndex - stepsRows;
            }
          });
        });
        messages.forEach((message, index) => {
          let isFoodMessage = false;
          const foodTags = ['report.food', 'answer.food'];
          message.tags.forEach(tag => isFoodMessage = isFoodMessage || foodTags.indexOf(tag) >= 0);
          if (isFoodMessage && indices[index]) {
            const closestDataIndex = indices[index] > -2 ? indices[index] + 1 : 1;
            this.chartData.dataTable[closestDataIndex][2] = message.content;
            this.chartData.dataTable[closestDataIndex][3] = message.content;
          }
        });
        if (this.chartComponent && this.chartComponent.chartComponent) {
          this.chartComponent.chartComponent.draw();
        }
      });
    });
  }
}
