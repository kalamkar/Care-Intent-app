import {Component, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {COMMA, ENTER} from '@angular/cdk/keycodes';
// @ts-ignore
import {DateTime, Duration} from 'luxon';
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {Person} from "../model/model";
import {AddPersonComponent} from "../add-person/add-person.component";
import {MatDialog} from "@angular/material/dialog";
import {MatChipInputEvent} from "@angular/material/chips";
import {OpenTicketComponent} from "../open-ticket/open-ticket.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SendMessageComponent} from "../send-message/send-message.component";
import {AddNoteComponent} from "../add-note/add-note.component";
import {NotesComponent} from "./notes/notes.component";

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private readonly routeSubscription: Subscription;
  private subscription: Subscription | undefined;

  personId: string | undefined;
  person: Person | undefined;
  coaches = new Array<any>();

  @ViewChild(NotesComponent) notes!: NotesComponent;

  chartStartEndTimePairs: Array<Array<DateTime>> = new Array<Array<DateTime>>();
  readonly NUM_OF_DAYS = 1;

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const urlId = this.route.snapshot.paramMap.get('id');
        if (this.personId !== urlId && urlId) {
          this.personId = urlId;
          this.init();
        }
      }
    });
  }

  init(noCache = false): void {
    if (!this.personId) {
      return;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.api.getResource('person', this.personId, noCache || undefined)
          .subscribe((person) => {
      this.person = person;
    });

    this.api.getParents({'type': 'person', 'value': this.personId}, 'member', 'person',
          noCache || undefined).subscribe((parents) => {
      this.coaches = parents;
    });

    this.chartStartEndTimePairs = [];
    const cacheMillis = 10 * 60 * 1000;
    const now = DateTime.fromMillis(Math.floor(DateTime.now().toMillis() / cacheMillis) * cacheMillis);
    for (let i = 0; i < this.NUM_OF_DAYS; i++) {
      this.chartStartEndTimePairs.push([
        now.minus(Duration.fromMillis((i + 1) * 24 * 60 * 60 * 1000)),
        now.minus(Duration.fromMillis(i * 24 * 60 * 60 * 1000))]);
    }
  }

  edit(): void {
    this.dialog.open(AddPersonComponent, {
      data: {person: this.person}
    }).afterClosed().subscribe(result => {
      this.init(true);
    });
  }


  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && this.person) {
      if (this.person.tags) {
        this.person.tags.push(value);
      } else {
        this.person.tags = [value];
      }
      this.api.editResource('person', {'id': this.person.id, 'tags': this.person.tags})
          .subscribe((person: Person) => {
        this.snackBar.open('Tag added', 'Ok', {duration: 3000});
      }, error => {
        this.snackBar.open('Failed to add tag', 'Ok');
      });
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.person && this.person.tags ? this.person.tags.indexOf(tag) : -1;

    if (index >= 0 && this.person && this.person.tags) {
      this.person.tags.splice(index, 1);
      this.api.editResource('person', {'id': this.person.id, 'tags': this.person.tags})
        .subscribe((person: Person) => {
          this.snackBar.open('Tag removed', 'Ok', {duration: 3000});
      }, error => {
          this.snackBar.open('Failed to remove tag', 'Ok');
      });
    }
  }

  addConversation(conversationType: string): void {
    if (!this.person || !conversationType) {
      return;
    }
    if (!this.person.conversations) {
      this.person.conversations = [];
    }
    const conv: {[_:string]: string} = {'type': conversationType};
    if (conversationType === 'followup') {
      conv['check'] = 'tasks';
      conv['repeat'] = ''
    }
    this.person.conversations.push(conv)
  }

  addTask(taskData: string): void {
    if (!this.person || !taskData) {
      return;
    }
    if (!this.person.tasks) {
      this.person.tasks = [];
    }
    this.person.tasks.push({'data': taskData})
  }

  saveConversations(): void {
    if (this.person && this.person.conversations) {
      this.api.editResource('person', {'id': this.person.id, 'conversations': this.person.conversations})
        .subscribe((person: Person) => {
          if (!this.person || !this.person.id) {
            this.snackBar.open('Failed to update conversation schedule', 'Ok');
            return;
          }
          this.api.updateSchedule(this.person.id.value).subscribe(response => {
            this.snackBar.open('Conversations updated', 'Ok', {duration: 3000});
          }, error => {
            this.snackBar.open('Failed to update conversation schedule', 'Ok');
          });
        }, error => {
          this.snackBar.open('Failed to update conversations', 'Ok');
        });
    }
  }

  saveTasks(): void {
    if (this.person && this.person.conversations) {
      this.api.editResource('person', {'id': this.person.id, 'tasks': this.person.tasks})
        .subscribe((person: Person) => {
          this.snackBar.open('Tasks updated', 'Ok', {duration: 3000});
        }, error => {
          this.snackBar.open('Failed to update tasks', 'Ok');
        });
    }
  }

  saveMessages(): void {
    if (this.person && this.person.message_id) {
      this.api.editResource('person', {'id': this.person.id, 'message_id': this.person.message_id})
        .subscribe((person: Person) => {
          this.snackBar.open('Messages updated', 'Ok', {duration: 3000});
        }, error => {
          this.snackBar.open('Failed to update messages', 'Ok');
        });
    }
  }

  openTicket() {
    if (!this.person || !this.person.id) {
      return
    }
    this.dialog.open(OpenTicketComponent, {data: {personId: this.person.id.value}, width: '512px'}).afterClosed()
      .subscribe(result => setTimeout(() => this.init(true), 1000));
  }

  sendMessage() {
    this.dialog.open(SendMessageComponent, {data: {person: this.person,
        coach: this.coaches.length > 0 ? this.coaches[0] : undefined}, width: '512px'})
        .afterClosed().subscribe(result => this.init(true));
  }

  addNote() {
    this.dialog.open(AddNoteComponent, {data: {person: this.person}, width: '512px'})
      .afterClosed().subscribe(result => setTimeout(() => this.notes.init(), 1000));
  }
}
