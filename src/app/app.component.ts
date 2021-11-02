import {Component, OnInit} from '@angular/core';
import {Group, Person} from "./model/model";
import {MatDialog} from "@angular/material/dialog";
import {LoginComponent} from "./login/login.component";
import {ContextService} from "./services/context.service";
import {ApiService} from "./services/api.service";
import {Router} from "@angular/router";
import {AddGroupComponent} from "./add-group/add-group.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'app';
  isLoading = false;
  user: Person|undefined;
  groups: Array<Group> = [];

  constructor(private context: ContextService,
              public api: ApiService,
              private router: Router,
              private dialog: MatDialog) {
    context.personChange.subscribe((user: Person) => {
      this.user = user;
      if (!user) {
        this.showLogin();
      }
    });
    context.groupsChange.subscribe((groups: Array<Group>) => {
      this.groups = groups;
    });
    api.activityChange.subscribe((isActive: boolean) => {
      this.isLoading = isActive;
    });
  }

  ngOnInit(): void {

  }

  showLogin() {
    this.dialog.open(LoginComponent, {
      minWidth: '400px',
      minHeight: '300px',
      disableClose: true,
      data: {}
    }).afterClosed().subscribe((response) => {
      if (response) {
        localStorage.setItem('auth', JSON.stringify(response));
        localStorage.removeItem('noCacheDefault');
        this.context.init();
      }
    });
  }

  signOut(): void {
    localStorage.removeItem('auth');
    this.user = undefined;
    this.router.navigateByUrl('/');
    this.showLogin();
  }

  add(): void {
    this.dialog.open(AddGroupComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {}
    }).afterClosed().subscribe(result => {
      this.context.loadGroups();
    });
  }
}
