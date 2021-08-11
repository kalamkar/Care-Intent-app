import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Identifier, Person, RelationType} from "../model/model";

@Component({
  selector: 'app-add-person',
  templateUrl: './add-person.component.html',
  styleUrls: ['./add-person.component.scss']
})
export class AddPersonComponent implements OnInit {

  person: Person;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddPersonComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {person: Person | undefined,
                groupId: Identifier, relationType: string}) {
    if (this.data.person) {
      this.person = this.data.person;
    } else {
      this.person = {name: {first: '', last: ''}, identifiers: [{type: 'phone', value: '', active: true}]};
    }
  }

  ngOnInit(): void {
  }

  add(): void {
    this.isInProcess = true;
    if (this.data.person) {
      this.api.editResource('person', this.person).subscribe((person: Person) => {
        this.dialogRef.close(true);
      }, error => this.onError());
    } else {
      this.api.addResource('person', this.person).subscribe((person: Person) => {
        if (!person || !person.id) {
          this.onError(true);
          return;
        }
        if (this.data.groupId && this.data.relationType) {
          const relation = {source: person.id, type: this.data.relationType, target: this.data.groupId};
          this.api.addRelation(relation).subscribe(result => {
            this.dialogRef.close(true);
          }, error => this.onError());
        } else {
          this.dialogRef.close(true);
        }
      }, error => this.onError());
    }
  }

  onError(close: boolean = false) {
    this.isInProcess = false;
    if (close) {
      this.dialogRef.close(false);
    }
  }
}
