import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ApiService} from "../services/api.service";
import {MatTabGroup} from "@angular/material/tabs";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  @ViewChild('tabs') public tabs: MatTabGroup | undefined;

  identifier: string = '';
  code: string = '';
  password: string = '';
  confirmPassword: string = '';

  isRecovery = false;
  isInProcess = false;
  errorMessage = '';

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<LoginComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {}) { }

  ngOnInit(): void {
  }

  login(): void {
    this.errorMessage = '';
    this.identifier = this.getInternationalizedNumber(this.identifier);
    if (!this.identifier || !this.identifier.startsWith('+')) {
      this.errorMessage = 'Invalid phone number';
      return;
    }
    this.isInProcess = true;
    this.api.login(this.identifier, this.password).subscribe(result => {
      this.dialogRef.close(result);
    }, error => {
      this.errorMessage = 'Failed to login';
      this.isInProcess = false;
    });
  }

  signup() {
    this.errorMessage = '';
    if (this.password != this.confirmPassword) {
      this.errorMessage = 'Passwords dont match';
      return;
    }
    this.identifier = this.getInternationalizedNumber(this.identifier);
    if (!this.identifier || !this.identifier.startsWith('+')) {
      this.errorMessage = 'Invalid phone number';
      return;
    }
    this.isInProcess = true;
    this.api.signup(this.identifier, this.password).subscribe(result => {
      this.isInProcess = false;
      if (this.tabs) {
        this.password = '';
        this.tabs.selectedIndex = 2;
      }
    }, error => {
      this.errorMessage = 'Failed to signup';
      this.isInProcess = false;
    });
  }

  recover() {
    this.errorMessage = '';
    this.identifier = this.getInternationalizedNumber(this.identifier);
    if (!this.identifier || !this.identifier.startsWith('+')) {
      this.errorMessage = 'Invalid phone number';
      return;
    }
    this.isInProcess = true;
    this.api.recover(this.identifier).subscribe(result => {
      this.isInProcess = false;
      this.isRecovery = true;
      if (this.tabs) {
        this.password = '';
        this.tabs.selectedIndex = 2;
      }
    }, error => {
      this.errorMessage = 'Failed to recover';
      this.isInProcess = false;
    });
  }

  verify() {
    this.errorMessage = '';
    if (this.isRecovery && this.password != this.confirmPassword) {
      this.errorMessage = 'Passwords dont match';
      return;
    }
    this.isInProcess = true;
    this.api.verify(this.code.toString(), this.isRecovery ? this.password : '').subscribe(result => {
      this.isInProcess = false;
      if (this.tabs) {
        this.tabs.selectedIndex = 0;
      }
    }, error => {
      this.errorMessage = 'Failed to verify';
      this.isInProcess = false;
    });
  }

  getInternationalizedNumber(phone: string) {
    phone = phone.replace(/[^+0-9]/g, '');
    if (phone.length == 10) {
      return '+1' + phone;
    }
    return phone;
  }
}
