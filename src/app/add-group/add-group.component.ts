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

  group: Group = {title: ''};

  isInProcess = false;

  constructor(private api: ApiService,
              public dialogRef: MatDialogRef<AddGroupComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {}) { }

  ngOnInit(): void {
  }

  add(): void {
    this.isInProcess = true;
    this.api.addResource('groups', this.group).subscribe(result => {
      this.dialogRef.close();
    }, error => this.isInProcess = false);
  }
}
