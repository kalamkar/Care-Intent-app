import {Component} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {Person} from "../model/model";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent {
  private readonly routeSubscription: Subscription;
  private subscription: Subscription | undefined;

  personId: string | undefined;
  person: Person | undefined;
  times: Array<Array<DateTime>> = new Array<Array<DateTime>>();

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,) {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const urlId = this.route.snapshot.paramMap.get('id');
        if (this.personId !== urlId && urlId) {
          this.personId = urlId;
          this.init();
        }
      }
    });
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.api.getResource('persons', this.personId).subscribe((person) => {
      this.person = person;
    });

    this.times = [];
    const cacheMillis = 10 * 60 * 1000;
    const now = DateTime.fromMillis(Math.floor(DateTime.now().toMillis() / cacheMillis) * cacheMillis);
    for (let i = 0; i < 7; i++) {
      this.times.push([
        now.minus(Duration.fromMillis((i + 1) * 24 * 60 * 60 * 1000)),
        now.minus(Duration.fromMillis(i * 24 * 60 * 60 * 1000))]);
    }
  }
}
