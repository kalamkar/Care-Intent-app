import {
  AfterViewInit,
  Component, ElementRef,
  Input,
  OnChanges, OnDestroy,
  OnInit, QueryList,
  SimpleChanges, ViewChild, ViewChildren
} from '@angular/core';
import {Message, Person} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
// @ts-ignore
import { DateTime } from 'luxon';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() person: Person | undefined;
  @ViewChildren('messages') messagesView: QueryList<any> | undefined;
  @ViewChild('sessionsView', {static: true}) sessionsView: ElementRef | undefined;

  isLoading = true;
  sessions = new Array<Message[]>();
  messages: Message[] = [];

  filters = [{name: 'Member', selected: true}, {name: 'System', selected: true}, {name: 'Coach', selected: true}];

  private messagesSubscription: Subscription | undefined;
  private messagesViewSubscription: Subscription | undefined;


  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngAfterViewInit(): void {
    if (this.messagesView) {
      this.messagesViewSubscription = this.messagesView.changes.subscribe(this.scrollToBottom);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.person) {
      this.init();
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  init(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.sessions = [];
    if (!this.person) {
      return;
    }
    this.loadData();
  }

  loadData(): void {
    if (!this.person || !this.person.id) {
      return;
    }
    this.isLoading = true;
    const endTime = DateTime.local().plus({days: 1}).endOf('day');
    const startTime = endTime.minus({days: 15});
    this.messagesSubscription = this.api.getMessages(this.person.id.value, startTime, endTime, true)
      .subscribe((messages: Message[]) => {
          this.messages = messages;
          this.createFilteredSessions();
          this.isLoading = false;
        },
        error => {
          this.isLoading = false;
        }
      );
  }

  createFilteredSessions() {
    this.sessions = [];
    let sessionStartTime = DateTime.local().minus({days: 15});
    let sessionId: string = sessionStartTime.toFormat('DDD');
    this.messages.forEach((message: Message) => {
      let include = false;
      this.filters.forEach(filter => {
        if (filter.selected &&
          ((filter.name === 'Member' && message.status === 'received' && !message.tags.includes('proxy')) ||
          (filter.name === 'Coach'  && message.status === 'sent' && message.tags.includes('proxy')) ||
          (filter.name === 'System' && message.status === 'sent' && !message.tags.includes('proxy')))) {
          include = true;
        }
      });
      if (!include) {
        return;
      }
      const messageTime = DateTime.fromISO(message.time);
      const sessionIds = message.tags.filter(tag => tag.startsWith('session:'));
      let newSessionId = '';
      if (sessionIds.length > 0) {
        newSessionId = sessionIds[0];
      } else if (messageTime > sessionStartTime.plus({minutes: 180})) {
        sessionStartTime = messageTime;
        newSessionId = sessionStartTime.toFormat('DDD');
      }
      if (this.sessions.length === 0 || sessionId !== newSessionId) {
        this.sessions.push([]);
        sessionId = newSessionId;
      }
      this.sessions[this.sessions.length - 1].push(message);
    });
  }

  scrollToBottom = () => {
    try {
      // @ts-ignore
      this.sessionsView.nativeElement.scrollTop = this.sessionsView.nativeElement.scrollHeight;
    } catch (err) {
    }
  };
}
