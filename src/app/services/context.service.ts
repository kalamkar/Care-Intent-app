import {EventEmitter, Injectable, Output} from '@angular/core';
import {Group, Person, RelationType} from "../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  @Output() personChange: EventEmitter<Person|null> = new EventEmitter();
  @Output() groupsChange: EventEmitter<Array<Group>> = new EventEmitter();

  private user: Person | undefined;
  groups: Array<Group> = [];

  private userSubscription: Subscription | undefined;
  private groupsSubscription: Subscription | undefined;

  constructor(private api: ApiService) {
    this.init();
  }

  init(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    this.userSubscription = this.api.getResource('person', 'me', true).subscribe(
      (user) => {
        this.user = user;
        this.personChange.emit(user);
        this.loadGroups();
      },
      (error) => {
        this.personChange.emit(null);
      });
  }

  loadGroups() {
    if (!this.user || !this.user.id) {
      return;
    }
    if (this.groupsSubscription) {
      this.groupsSubscription.unsubscribe();
    }
    this.groupsSubscription = this.api.getParents(this.user.id, RelationType.admin, 'group', true)
      .subscribe((groups) => {
        this.groups = groups;
        this.groupsChange.emit(this.groups);
      });
  }
}
