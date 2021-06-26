import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Group, Identifier, Person, RelationType} from "../model/model";

@Component({
  selector: 'app-add-person',
  templateUrl: './add-person.component.html',
  styleUrls: ['./add-person.component.scss']
})
export class AddPersonComponent implements OnInit {

  person: Person = {name: {first: '', last: ''}, identifiers: [{type: 'phone', value: '', active: true}]};

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddPersonComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {groupId: Identifier}) { }

  ngOnInit(): void {
  }

  add(): void {
    this.isInProcess = true;
    this.api.addResource('persons', this.person).subscribe((person: Person) => {
      if (!person || !person.id) {
        this.onError(true);
        return;
      }
      const relation = {source: person.id, type: RelationType.memberOf, target: this.data.groupId};
      this.api.addRelation(relation).subscribe(result => {
        this.dialogRef.close();
      }, error => this.onError());
    }, error => this.onError());
  }

  onError(close: boolean = false) {
    this.isInProcess = false;
    if (close) {
      this.dialogRef.close();
    }
  }
}
