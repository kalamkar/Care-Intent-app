import {Component, Inject, OnInit} from '@angular/core';
import {Person} from "../model/model";
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss']
})
export class AddNoteComponent implements OnInit {

  person: Person;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddNoteComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {person: Person}) {
    this.person = this.data.person;
  }

  ngOnInit(): void {
  }

  add(content: string): void {
    if (!this.person.id) {
      return;
    }
    this.isInProcess = true;
    this.api.addNote(content, this.person.id.value).subscribe(response => {
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
