import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ApiService} from "../services/api.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  identifier: string = '';
  password: string = '';
  confirmPassword: string = '';
  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<LoginComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {}) { }

  ngOnInit(): void {
  }

  login(): void {
    this.api.login(this.identifier, this.password).subscribe(result => {
      this.dialogRef.close(result);
    }, error => {
    });
  }

  signup() {
  }

  forgot() {
  }
}
