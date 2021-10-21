import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {AddPersonComponent} from "../add-person/add-person.component";
import {Group, Identifier, Person} from "../model/model";

@Component({
  selector: 'app-add-parent',
  templateUrl: './add-parent.component.html',
  styleUrls: ['./add-parent.component.scss']
})
export class AddParentComponent implements OnInit {

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddPersonComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {personId: Identifier,
                availableParents: Array<Person|Group>, relationType: string}) {
  }

  ngOnInit(): void {
  }

  add(parent: Person | Group): void {
    if (!parent || !parent.id) {
      return;
    }
    this.isInProcess = true;
    this.api.addRelation(parent.id, this.data.personId, this.data.relationType).subscribe(result => {
      this.dialogRef.close(true);
    }, error => this.onError());
  }

  onError(close: boolean = false) {
    this.isInProcess = false;
    if (close) {
      this.dialogRef.close(false);
    }
  }
}
