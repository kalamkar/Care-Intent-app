import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {DataPoint} from "../model/model";
// @ts-ignore
import {DateTime} from 'luxon';
import {GoogleChartInterface} from "ng2-google-charts/google-charts-interfaces";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  private readonly routeSubscription: Subscription;
  private personSubscription: Subscription | null;

  personId: string | null;
  data: GoogleChartInterface = {
    chartType: 'ScatterChart',
    options: {
      height: 500,
      series: {
        0: {targetAxisIndex: 0},
        1: {targetAxisIndex: 1}
      },
      vAxes: {
        0: {title: 'Glucose mg/dL'},
        1: {title: 'Steps'}
      }
    },
    dataTable: []
  };

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,) {
    this.personId = null;
    this.personSubscription = null;
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
    if (this.personSubscription) {
      this.personSubscription.unsubscribe();
    }
    if (this.personId) {
      const names = ['glucose', 'steps'];
      this.personSubscription = this.api.getData(this.personId, names).subscribe((rows: DataPoint[]) => {
        this.data.dataTable = [];
        this.data.dataTable.push(['Time', 'Glucose', 'Steps']);
        rows.forEach(row => {
          if (row.name === 'glucose') {
            this.data.dataTable.push([DateTime.fromISO(row.time).toJSDate(), row.number, null])
          } else if (row.name === 'steps') {
            this.data.dataTable.push([DateTime.fromISO(row.time).toJSDate(), null, row.number])
          }
        });
      });
    }
  }
}
