import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiService} from "../services/api.service";
import {Group, Person, RelationType} from "../model/model";
import {Subscription} from "rxjs";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {AddPersonComponent} from "../add-person/add-person.component";
import {AddGroupComponent} from "../add-group/add-group.component";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnChanges {

  @Input() groupId: string | undefined;
  group: Group | undefined;
  members: Array<Person> = [];
  isMainPage = false;

  private readonly routeSubscription: Subscription;
  private groupSubscription: Subscription | undefined;
  private membersSubscription: Subscription | undefined;

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog) {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const urlId = this.route.snapshot.paramMap.get('id');
        if (this.groupId !== urlId && urlId) {
          this.groupId = urlId;
          this.isMainPage = true;
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

    if (this.groupSubscription) {
      this.groupSubscription.unsubscribe();
    }
    this.groupSubscription = this.api.getResource('groups', this.groupId).subscribe(group => {
      this.group = group;
    });

    if (this.membersSubscription) {
      this.membersSubscription.unsubscribe();
    }
    this.membersSubscription = this.api.query(RelationType.memberOf, 'target',
      {'type': 'group', 'value': this.groupId}).subscribe((members) => {
      this.members = members;
    });
  }

  add(relationType: string): void {
    this.dialog.open(AddPersonComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {groupId: {'type': 'group', 'value': this.groupId}, relationType}
    });
  }

  edit(): void {
    this.dialog.open(AddGroupComponent, {
      data: {group: this.group}
    });
  }
}
