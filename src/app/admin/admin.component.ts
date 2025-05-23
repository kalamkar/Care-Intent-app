import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Group, Identifier, Person, RelationType} from "../model/model";
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatTableDataSource} from "@angular/material/table";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {AddPersonComponent} from "../add-person/add-person.component";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatSort} from "@angular/material/sort";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnChanges, AfterViewInit {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  personId: string | undefined;
  person: Person | undefined;
  members: Array<Person> = [];
  memberGroups = new Map<string, Array<Group>>();

  memberDataSource = new MatTableDataSource();
  @ViewChild(MatSort) sort!: MatSort;

  private readonly routeSubscription: Subscription;
  private personSubscription: Subscription | undefined;
  private membersSubscription: Subscription | undefined;

  memberColumns: string[] = ['name', 'groups', 'time', 'summary', 'menu'];

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
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

  ngAfterViewInit(): void {
    if (this.sort) {
      this.memberDataSource.sort = this.sort;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  init(noCache = false): void {
    if (!this.personId) {
      this.members = [];
      return;
    }

    if (this.personSubscription) {
      this.personSubscription.unsubscribe();
    }
    this.personSubscription = this.api.getResource('person', this.personId, noCache || undefined)
          .subscribe((person) => {
      this.person = person;
    });

    if (this.membersSubscription) {
      this.membersSubscription.unsubscribe();
    }
    this.memberGroups.clear();
    this.membersSubscription = this.api.getChildren({'type': 'person', 'value': this.personId}, RelationType.member,
          noCache || undefined).subscribe((members) => {
        let data: unknown[] = [];
        members.forEach(member => {
          data.push({'member': member, 'summary': '', time: member.session && member.session.last_message_time?
              DateTime.fromFormat(member.session.last_message_time, 'ccc, dd LLL yyyy HH:mm:ss z') : null});
        });
        this.members = members;
        this.memberDataSource.data = data;
        this.members.forEach(member => {
          if (member.id) {
            this.api.getParents(member.id, RelationType.member).subscribe((groups) => {
              if (member.id) {
                this.memberGroups.set(member.id.value, groups);
              }
            })
          }
        });
      });
  }


  edit(): void {
    this.dialog.open(AddPersonComponent, {
      data: {person: this.person}
    }).afterClosed().subscribe(result => {
      this.init(true);
    });
  }

  add(relationType: string): void {
    this.dialog.open(AddPersonComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {parentId: {'type': 'person', 'value': this.personId}, relationType}
    }).afterClosed().subscribe(result => {
      this.init(true);
    });
  }

  remove(memberId: Identifier) {
    if (this.personId) {
      this.api.removeRelation({'type': 'person', 'value': this.personId}, memberId, 'member').subscribe(
        _ => {
          this.snackBar.open('Member removed', 'Ok', {duration: 3000});
          this.init(true);
          },
        error => {this.snackBar.open('Failed to remove member', 'Ok');}
      );
    }
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && this.person) {
      if (this.person.tags) {
        this.person.tags.push(value);
      } else {
        this.person.tags = [value];
      }
      this.api.editResource('person', {'id': this.person.id, 'tags': this.person.tags})
        .subscribe((person: Person) => {
          this.snackBar.open('Tag added', 'Ok', {duration: 3000});
        }, error => {
          this.snackBar.open('Failed to add tag', 'Ok');
        });
    }
    event.chipInput!.clear();

  }

  removeTag(tag: string): void {
    const index = this.person && this.person.tags ? this.person.tags.indexOf(tag) : -1;

    if (index >= 0 && this.person && this.person.tags) {
      this.person.tags.splice(index, 1);
      this.api.editResource('person', {'id': this.person.id, 'tags': this.person.tags})
        .subscribe((person: Person) => {
          this.snackBar.open('Tag removed', 'Ok', {duration: 3000});
        }, error => {
          this.snackBar.open('Failed to remove tag', 'Ok');
        });
    }
  }
}
