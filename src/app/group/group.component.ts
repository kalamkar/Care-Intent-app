import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnChanges {

  @Input() groupId: string | undefined;
  group: Group | undefined;
  memberCoaches = new Map<string, Person>();
  isMainPage = false;

  memberDataSource = new MatTableDataSource();
  adminDataSource = new MatTableDataSource();

  private readonly routeSubscription: Subscription;
  private groupSubscription: Subscription | undefined;
  private membersSubscription: Subscription | undefined;
  private adminsSubscription: Subscription | undefined;

  memberColumns: string[] = ['name', 'coach', 'summary', 'menu'];
  adminColumns: string[] = ['name', 'summary', 'menu'];

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
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
      this.memberCoaches.clear();
      return;
    }

    if (this.groupSubscription) {
      this.groupSubscription.unsubscribe();
    }
    this.groupSubscription = this.api.getResource('group', this.groupId).subscribe(group => {
      this.group = group;
    });

    if (this.membersSubscription) {
      this.membersSubscription.unsubscribe();
    }
    this.membersSubscription = this.api.getChildren({'type': 'group', 'value': this.groupId}, RelationType.member)
        .subscribe((members) => {
      let data: unknown[] = [];
      members.forEach(member => {
        data.push({'member': member, 'summary': ''});
      });
      this.memberDataSource.data = data;
    });

    if (this.adminsSubscription) {
      this.adminsSubscription.unsubscribe();
    }
    this.adminsSubscription = this.api.getChildren({'type': 'group', 'value': this.groupId}, RelationType.admin)
      .subscribe((admins) => {
        let data: unknown[] = [];
        admins.forEach(admin => {
          data.push({'admin': admin, 'summary': ''});
          this.api.getChildren(admin.id, RelationType.member).subscribe(members => {
            members.forEach(member => {
              this.memberCoaches.set(member.id.value, admin);
            });
          });
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
      this.init();
    });
  }

  remove(personId: Identifier, relationType: string) {
    if (this.groupId) {
      this.api.removeRelation({'type': 'group', 'value': this.groupId}, personId, relationType).subscribe(
        _ => {
          this.snackBar.open('Removed ' + relationType, 'Ok', {duration: 3000});
          this.init();
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
      this.init();
    });
  }

  addParent(personId: Identifier) {
    const admins = new Array<Person>();
    this.adminDataSource.data.forEach((row: any) => admins.push(row.admin));
    this.dialog.open(AddParentComponent, {
      data: {personId: personId, availableParents: admins, relationType: 'member'}
    }).afterClosed().subscribe(result => {
      this.init();
    });
  }
}
