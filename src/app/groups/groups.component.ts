import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiService} from "../services/api.service";
import {Group, RelationType} from "../model/model"
import {Subscription} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {AddGroupComponent} from "../add-group/add-group.component";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnChanges {

  @Input() userId: string | undefined;

  groups: Array<Group> = [];

  private subscription: Subscription | undefined;

  constructor(private api: ApiService,
              private dialog: MatDialog) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  init(): void {
    if (!this.userId ) {
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.api.getParents({'type': 'person', 'value': this.userId}, RelationType.admin)
          .subscribe((groups) => {
        this.groups = groups;
    });
  }


  add(): void {
    this.dialog.open(AddGroupComponent, {
      minWidth: '400px',
      minHeight: '300px',
      data: {}
    });
  }
}
