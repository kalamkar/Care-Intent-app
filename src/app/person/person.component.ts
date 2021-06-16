import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint, Message} from "../model/model";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {GoogleChartInterface} from "ng2-google-charts/google-charts-interfaces";
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";
import {Utils} from "../utils";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  private readonly MIN_STEPS_FOR_ANNOTATION = 1500;
  private readonly MIN_MINUTES_FOR_ANNOTATION = 30;
  private readonly MAX_MESSAGE_DIFF = Duration.fromMillis(5 * 60 * 1000);

  @ViewChild('comboChart') public comboChart: AppGoogleChartComponent | undefined;

  private readonly routeSubscription: Subscription;
  private dataSubscription: Subscription | null = null;
  private messagesSubscription: Subscription | null = null;

  personId: string | null = null;

  comboChartData: GoogleChartInterface = {
    chartType: 'ComboChart',
    options: {
      height: 500,
      annotations: {
        textStyle: {
          color: 'grey',
        },
        stem: {length: 20, color: 'red'}
      },
      series: {
        0: {targetAxisIndex: 0, type: 'line'},
        1: {targetAxisIndex: 1, type: 'line', lineWidth: 16},
        2: {targetAxisIndex: 2, type: 'scatter'}
      },
      vAxes: {
        0: {},
        1: {gridlines: {color: 'transparent'}, maxValue: 250, minValue: 0},
        2: {gridlines: {color: 'transparent'}, maxValue: 250, minValue: 0}
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
        this.comboChartData.dataTable[1][1] = -1;
      }
      if (this.comboChart && this.comboChart.chartComponent) {
        this.comboChart.chartComponent.draw();
      }

      if (this.messagesSubscription) {
        this.messagesSubscription.unsubscribe();
      }
      this.messagesSubscription = this.api.getMessages(this.personId || '').subscribe((messages: Message[]) => {
        if (!messages || messages.length === 0) {
          return;
        }
        let prevMessage: {time: null|DateTime, content: null|string} = {time: null, content: null};
        messages.forEach((message, index) => {
          let isFoodMessage = false;
          const foodTags = ['report.food', 'answer.food'];
          message.tags.forEach(tag => isFoodMessage = isFoodMessage || foodTags.indexOf(tag) >= 0);
          if (isFoodMessage) {
            let content = message.content;
            let messageTime = DateTime.fromISO(message.time).minus(Duration.fromMillis(3 * 60 * 60 * 1000));
            if (prevMessage.time != null && prevMessage.time.diff(messageTime) < Duration.fromMillis(5 * 60 * 1000)) {
              content = prevMessage.content + ' ' + content;
              this.comboChartData.dataTable[this.comboChartData.dataTable.length - 2][7] = content;
              this.comboChartData.dataTable[this.comboChartData.dataTable.length - 2][8] = content;
            } else {
              const messageEndTime = messageTime.plus(Duration.fromMillis(5 * 60 * 1000));
              this.comboChartData.dataTable.push([messageTime.toJSDate(), null, null, null, null, null, 50, content, content]);
              this.comboChartData.dataTable.push([messageEndTime.toJSDate(), null, null, null, null, null, 50, null, null]);
              prevMessage = {time: messageTime, content: message.content};
            }
          }
        });
        if (this.comboChart && this.comboChart.chartComponent) {
          this.comboChart.chartComponent.draw();
        }
      });
    });
  }
}
