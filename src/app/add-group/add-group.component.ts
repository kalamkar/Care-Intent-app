import {Component, Inject, OnInit} from '@angular/core';
import {ApiService} from "../services/api.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Group} from "../model/model";

@Component({
  selector: 'app-add-group',
  templateUrl: './add-group.component.html',
  styleUrls: ['./add-group.component.scss']
})
export class AddGroupComponent implements OnInit {

  group: Group;

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddGroupComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {group: Group | undefined}) {
    if (!this.data.group) {
      this.group = {title: ''};
    } else {
      this.group = {id: this.data.group.id, title: this.data.group.title};
    }
  }

  ngOnInit(): void {
  }

  add(): void {
    this.isInProcess = true;
    if (this.data.group) {
      this.api.editResource('group', this.group).subscribe(result => {
        this.dialogRef.close();
      }, error => this.isInProcess = false);
    } else {
      this.api.addResource('group', this.group).subscribe(result => {
        this.dialogRef.close();
      }, error => this.isInProcess = false);
    }
  }
}
