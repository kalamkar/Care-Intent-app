import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Person} from "../model/model";

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit {

  person: Person;
  coach: Person;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<SendMessageComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {person: Person, coach: Person}) {
    this.person = this.data.person;
    this.coach = this.data.coach;
  }

  ngOnInit(): void {
  }

  sendToMember(content: string): void {
    if (!this.person.id) {
      return;
    }
    this.isInProcess = true;
    this.api.sendMessage(content, this.person.id.value).subscribe(response => {
      this.dialogRef.close(true);
    }, error => {
      this.onError();
    });
  }

  sendToCoach(content: string): void {
    if (!this.person.id || !this.coach.id) {
      return;
    }
    this.isInProcess = true;
    this.api.sendProxyMessage(content, this.coach.id.value, this.person.id.value).subscribe(response => {
      this.dialogRef.close(true);
    }, error => {
      this.onError();
    });
  }

  onError(close: boolean = false) {
    this.isInProcess = false;
    if (close) {
      this.dialogRef.close(false);
    }
  }
}
