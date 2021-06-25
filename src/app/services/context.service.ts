import {EventEmitter, Injectable, Output} from '@angular/core';
import {Person} from "../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  @Output() personChange: EventEmitter<Person|null> = new EventEmitter();

  private user: Person | null = null;
  private subscription: Subscription | null = null;

  constructor(private api: ApiService) {
    this.init();
  }

  init(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.api.getResource('persons', 'me', true).subscribe(
      (user) => {
        this.user = user;
        this.personChange.emit(user);
      },
      (error) => {
        this.personChange.emit(null);
      });
  }
}
