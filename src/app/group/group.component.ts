import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiService} from "../services/api.service";
import {Person, RelationType} from "../model/model";
import {Subscription} from "rxjs";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {AddPersonComponent} from "../add-person/add-person.component";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnChanges {

  @Input() groupId: string | undefined;
  members: Array<Person> = [];

  private readonly routeSubscription: Subscription;
  private subscription: Subscription | undefined;

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog) {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const urlId = this.route.snapshot.paramMap.get('id');
        if (this.groupId !== urlId && urlId) {
          this.groupId = urlId;
          this.init();
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  init(): void {
    if (!this.groupId) {
      this.members = [];
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.api.query(RelationType.memberOf, 'target',
      {'type': 'group', 'value': this.groupId}).subscribe((members) => {
      this.members = members;
    });
  }

  add(): void {
    this.dialog.open(AddPersonComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {}
    });
  }
}
