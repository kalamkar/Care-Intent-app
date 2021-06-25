import {Component, OnInit} from '@angular/core';
import {Person} from "./model/model";
import {MatDialog} from "@angular/material/dialog";
import {LoginComponent} from "./login/login.component";
import {ContextService} from "./services/context.service";
import {ApiService} from "./services/api.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'app';
  isLoading = false;
  user: Person|undefined;

  constructor(private context: ContextService,
              private api: ApiService,
              private dialog: MatDialog) {
    context.personChange.subscribe((user: Person) => {
      this.user = user;
      if (!user) {
        this.showLogin();
      }
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
        this.context.init();
      }
    });
  }

  signOut(): void {
    localStorage.removeItem('auth');
    this.user = undefined;
    this.showLogin();
  }
}
