import {Component, OnInit} from '@angular/core';
import {AuthService} from "./services/auth.service";
import {Person} from "./model/model";
import {MatDialog} from "@angular/material/dialog";
import {LoginComponent} from "./login/login.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'app';
  isLoading = false;
  user: Person|null = null;

  constructor(private auth: AuthService,
              private dialog: MatDialog) {
    auth.personChange.subscribe((user: Person|null) => {
      this.user = user;
      if (!user) {
        this.showLogin();
      }
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
        this.auth.init();
      }
    });
  }

  signOut(): void {
    localStorage.removeItem('auth');
    this.user = null;
    this.showLogin();
  }
}
