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
                parentId: Identifier, relationType: string}) {
    if (this.data.person) {
      this.person = {id: this.data.person.id, name: this.data.person.name, identifiers: this.data.person.identifiers};
    } else {
      this.person = {name: {first: '', last: ''}, identifiers: [{type: 'phone', value: ''}]};
    }
    if (!this.person.name) {
      this.person.name = {first: '', last: ''};
    }
  }

  ngOnInit(): void {
  }

  add(): void {
    this.isInProcess = true;
    let isValid = this.person.identifiers.length > 0;
    this.person.identifiers.forEach(id => {
      if (id.type === 'phone') {
        id.value = this.getInternationalizedNumber(id.value);
        isValid = isValid && id.value.startsWith('+');
      }
    });
    if (!isValid) {
      return;
    }
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
        if (this.data.parentId && this.data.relationType) {
          const relation = {source: person.id, type: this.data.relationType, target: this.data.parentId};
          this.api.addRelation(this.data.parentId, person.id, this.data.relationType).subscribe(result => {
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

  hasValidIdentifier() : boolean {
    let isValid = this.person.identifiers.length > 0;
    this.person.identifiers.forEach(id => {
      if (id.type === 'phone') {
        const sanitized = this.getInternationalizedNumber(id.value);
        isValid = isValid && sanitized.startsWith('+');
      }
    });
    return isValid
  }

  getInternationalizedNumber(phone: string) {
    phone = phone.replace(/[^+0-9]/g, '');
    if (phone.length === 10) {
      return '+1' + phone;
    }
    return phone;
  }
}
