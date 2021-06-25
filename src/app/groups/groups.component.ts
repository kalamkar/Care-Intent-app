import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiService} from "../services/api.service";
import {Group, RelationType} from "../model/model"
import {Subscription} from "rxjs";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnChanges {

  @Input() userId: string | undefined;

  groups: Array<Group> = [];

  private subscription: Subscription | undefined;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.init();
  }

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
    this.subscription = this.api.query(RelationType.adminOf, 'source',
      {'type': 'person', 'value': this.userId}).subscribe((groups) => {
        this.groups = groups;
    });
  }

}
