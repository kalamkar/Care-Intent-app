import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.scss']
})
export class SendMessageComponent implements OnInit {

  personId: string;
  coachId: string;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<SendMessageComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {personId: string, coachId: string}) {
    this.personId = this.data.personId;
    this.coachId = this.data.coachId;
  }

  ngOnInit(): void {
  }

  send(content: string, userId: string): void {
    this.isInProcess = true;
    if (this.personId) {
      this.api.sendMessage(content, userId).subscribe(response => {
        this.dialogRef.close(true);
      }, error => {
        this.onError();
      });
    }
  }

  onError(close: boolean = false) {
    this.isInProcess = false;
    if (close) {
      this.dialogRef.close(false);
    }
  }
}
