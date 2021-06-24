import {EventEmitter, Injectable, Output} from '@angular/core';
import {ApiService} from "./api.service";
import {Person} from "../model/model";
import {Subscription} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  @Output() personChange: EventEmitter<Person|null> = new EventEmitter();

  private user: Person | null = null;
  private subscription: Subscription | null = null;
  private isLoading = false;

  constructor(private api: ApiService) {
    this.init();
  }

  init(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.isLoading = true;
    this.subscription = this.api.getResource('persons', 'me', true).subscribe(
      (user) => {
        this.user = user;
        this.isLoading = false;
        this.personChange.emit(user);
      },
      (error) => {
        this.isLoading = false;
        this.personChange.emit(null);
      });
  }
}
