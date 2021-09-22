import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-open-ticket',
  templateUrl: './open-ticket.component.html',
  styleUrls: ['./open-ticket.component.scss']
})
export class OpenTicketComponent implements OnInit {

  personId: string;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<OpenTicketComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {personId: string}) {
    this.personId = this.data.personId;
  }

  ngOnInit(): void {
  }

  open(category: string, title: string): void {
    this.isInProcess = true;
    if (this.personId) {
      this.api.openTicket(category, title, this.personId).subscribe(response => {
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
