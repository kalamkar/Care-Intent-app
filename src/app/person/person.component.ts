import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {AppGoogleChartComponent} from "../google-chart/app-google-chart.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {
  private readonly routeSubscription: Subscription;

  personId: string | null = null;
  times: Array<Array<DateTime>> = new Array<Array<DateTime>>();

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
    this.times = [];
    for (let i = 0; i < 7; i++) {
      this.times.push([
        DateTime.now().minus(Duration.fromMillis((i + 1) * 24 * 60 * 60 * 1000)),
        DateTime.now().minus(Duration.fromMillis(i * 24 * 60 * 60 * 1000))]);
    }
  }
}
