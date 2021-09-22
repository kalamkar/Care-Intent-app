import {Component} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {COMMA, ENTER} from '@angular/cdk/keycodes';
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {Person} from "../model/model";
import {AddGroupComponent} from "../add-group/add-group.component";
import {AddPersonComponent} from "../add-person/add-person.component";
import {MatDialog} from "@angular/material/dialog";
import {MatChipInputEvent} from "@angular/material/chips";
import {OpenTicketComponent} from "../open-ticket/open-ticket.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private readonly routeSubscription: Subscription;
  private subscription: Subscription | undefined;

  personId: string | undefined;
  person: Person | undefined;
  times: Array<Array<DateTime>> = new Array<Array<DateTime>>();

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog) {
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
    this.subscription = this.api.getResource('person', this.personId).subscribe((person) => {
      this.person = person;
    });

    this.times = [];
    const cacheMillis = 10 * 60 * 1000;
    const now = DateTime.fromMillis(Math.floor(DateTime.now().toMillis() / cacheMillis) * cacheMillis);
    for (let i = 0; i < 1; i++) {
      this.times.push([
        now.minus(Duration.fromMillis((i + 1) * 24 * 60 * 60 * 1000)),
        now.minus(Duration.fromMillis(i * 24 * 60 * 60 * 1000))]);
    }
  }

  edit(): void {
    this.dialog.open(AddPersonComponent, {
      data: {person: this.person}
    });
  }


  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value && this.person && this.person.tags) {
      this.person.tags.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.person && this.person.tags ? this.person.tags.indexOf(tag) : -1;

    if (index >= 0 && this.person && this.person.tags) {
      this.person.tags.splice(index, 1);
    }
  }

  openTicket() {
    if (this.person && this.person.id) {
      this.dialog.open(OpenTicketComponent, {data: {personId: this.person.id.value}});
    }
  }
}
