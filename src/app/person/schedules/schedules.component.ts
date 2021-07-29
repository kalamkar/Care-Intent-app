import {Component, Input, OnInit} from '@angular/core';
import {Schedule} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {
  @Input() personId: string | undefined;

  DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  schedules = new Array<Schedule>();

  private apiSubscription: Subscription | undefined;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }

    this.apiSubscription = this.api.getAllResources(['persons', this.personId, 'schedules']).subscribe(schedules => {
      this.schedules = schedules;
    });
  }

  addTiming(schedule: Schedule, day: string, time: string): void {
    schedule.timings.push({day, time});
    this.update(schedule);
  }

  create(data: Schedule): void {
    if ((this.apiSubscription && !this.apiSubscription.closed) || !this.personId) {
      return;
    }

    this.apiSubscription = this.api.addResource(['persons', this.personId, 'schedules'], data).subscribe(schedule => {
      this.schedules.push(schedule);
    });
  }

  update(original: Schedule): void {
    if ((this.apiSubscription && !this.apiSubscription.closed) || !this.personId) {
      return;
    }

    this.apiSubscription = this.api.editResource(['persons', this.personId, 'schedules'], original).subscribe(schedule => {
      this.schedules.splice(this.schedules.indexOf(original), 1, schedule);
    });
  }
}
