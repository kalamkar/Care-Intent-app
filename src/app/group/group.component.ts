import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ApiService} from "../services/api.service";
import {Group, Identifier, Person, RelationType} from "../model/model";
import {Subscription} from "rxjs";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {AddPersonComponent} from "../add-person/add-person.component";
import {AddGroupComponent} from "../add-group/add-group.component";
import {MatTableDataSource} from "@angular/material/table";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AddParentComponent} from "../add-parent/add-parent.component";
import {ContextService} from "../services/context.service";
import {MatSort} from "@angular/material/sort";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnChanges {

  @Input() groupId: string | undefined;
  group: Group | undefined;
  memberCoaches = new Map<string, Array<Person>>();
  members: Array<Person> = [];
  @ViewChild(MatSort) sort!: MatSort;

  memberDataSource = new MatTableDataSource();
  adminDataSource = new MatTableDataSource();

  private readonly routeSubscription: Subscription;
  private groupSubscription: Subscription | undefined;
  private membersSubscription: Subscription | undefined;
  private adminsSubscription: Subscription | undefined;

  memberColumns: string[] = ['name', 'coach', 'time', 'summary', 'menu'];
  adminColumns: string[] = ['name', 'time', 'summary', 'menu'];

  constructor(private api: ApiService,
              private context: ContextService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
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

  ngAfterViewInit() {
    if (this.sort) {
      this.memberDataSource.sort = this.sort;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  init(noCache = false): void {
    if (!this.groupId) {
      return;
    }

    if (this.groupSubscription) {
      this.groupSubscription.unsubscribe();
    }
    this.groupSubscription = this.api.getResource('group', this.groupId, noCache || undefined)
          .subscribe(group => {
      this.group = group;
    });

    if (this.membersSubscription) {
      this.membersSubscription.unsubscribe();
    }
    this.membersSubscription = this.api.getChildren({'type': 'group', 'value': this.groupId}, RelationType.member,
      noCache || undefined).subscribe((members) => {
      let data: unknown[] = [];
      this.members = members;
      members.forEach(member => {
        data.push({'member': member, 'summary': '',  time: member.session && member.session.last_message_time?
            DateTime.fromFormat(member.session.last_message_time, 'ccc, dd LLL yyyy HH:mm:ss z') : null });
        this.api.getParents(member.id, RelationType.member, 'person').subscribe(coaches => {
          this.memberCoaches.set(member.id.value, coaches);
        });
      });
      this.memberDataSource.data = data;
    });

    if (this.adminsSubscription) {
      this.adminsSubscription.unsubscribe();
    }
    this.memberCoaches.clear();
    this.adminsSubscription = this.api.getChildren({'type': 'group', 'value': this.groupId}, RelationType.admin,
      noCache || undefined).subscribe((admins) => {
        let data: unknown[] = [];
        admins.forEach(admin => {
          data.push({'admin': admin, 'summary': '', time: admin.session && admin.session.last_message_time?
              DateTime.fromFormat(admin.session.last_message_time, 'ccc, dd LLL yyyy HH:mm:ss z') : null});
        });
        this.adminDataSource.data = data;
      });
  }

  add(relationType: string): void {
    this.dialog.open(AddPersonComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {parentId: {'type': 'group', 'value': this.groupId}, relationType}
    }).afterClosed().subscribe(result => {
      this.init(true);
    });
  }

  remove(personId: Identifier, relationType: string) {
    if (this.groupId) {
      this.api.removeRelation({'type': 'group', 'value': this.groupId}, personId, relationType).subscribe(
        _ => {
          this.snackBar.open('Removed ' + relationType, 'Ok', {duration: 3000});
          this.init(true);
        },
        error => {
          this.snackBar.open('Failed to remove ' + relationType, 'Ok');
        }
      );
    }
  }


  edit(): void {
    this.dialog.open(AddGroupComponent, {
      data: {group: this.group}
    }).afterClosed().subscribe(result => {
      this.init(true);
      this.context.loadGroups();
    });
  }

  addParent(person: Person, parentType: string, relationType: string) {
    const availableParents = new Array<Person|Group>();
    if (parentType === 'coach') {
      this.adminDataSource.data.forEach((row: any) => availableParents.push(row.admin));
    } else {
      this.context.groups.forEach((group: Group) => availableParents.push(group));
    }
    this.dialog.open(AddParentComponent, {
      data: {person: person, availableParents: availableParents, relationType: relationType}
    }).afterClosed().subscribe(result => {
      this.init(true);
    });
  }
}
