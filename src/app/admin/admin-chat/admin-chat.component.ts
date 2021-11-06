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
  selector: 'app-admin-chat',
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.scss']
})
export class AdminChatComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() person: Person | undefined;
  @Input() members: Array<Person> = [];
  @ViewChildren('messages') messagesView: QueryList<any> | undefined;
  @ViewChild('sessionsView', {static: true}) sessionsView: ElementRef | undefined;

  isLoading = true;
  sessions = new Map<Person | undefined, Array<DisplayMessage>>();

  senderTypes = ['Member', 'Coach', 'System'];

  private messagesSubscription: Subscription | undefined;
  private messagesViewSubscription: Subscription | undefined;

  private idPersons = new Map<string, Person>();

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
    } else if (changes.members) {
      this.idPersons.clear();
      this.members.forEach(person => {
        if (person.id) {
          this.idPersons.set(person.id.value, person);
        }
        if (person.proxy) {
          this.idPersons.set(person.proxy.value, person);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  init(noCache = false): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.sessions.clear();
    if (!this.person || !this.person.id) {
      return;
    }

    this.isLoading = true;
    const endTime = DateTime.local().plus({days: 1}).endOf('day');
    const startTime = endTime.minus({days: 15});
    this.messagesSubscription = this.api.getMessages(this.person.id.value, startTime, endTime, true,
      noCache || undefined)
      .subscribe((messages: Message[]) => {
          this.createFilteredSessions(messages);
          this.isLoading = false;
        },
        error => {
          this.isLoading = false;
        }
      );
  }

  createFilteredSessions(messages: Message[]) {
    messages.forEach((message: Message) => {
      const msg: DisplayMessage = message;
      let hasSessionTag = false;
      message.tags.forEach(tag => hasSessionTag = hasSessionTag || tag.startsWith('session:'));
      if (message.status === 'received') {
        msg.senderType = 'Coach';
      } else if (message.status === 'sent' && hasSessionTag) {
        msg.senderType = 'System';
      } else if (message.status === 'sent' && !hasSessionTag) {
        msg.senderType = 'Member';
      } else {
        return;
      }
      if (message.status === 'received') {
        msg.side = 'right';
      } else if (message.status === 'sent') {
        msg.side = 'left';
      }
      const messageTime = DateTime.fromISO(message.time);
      let member;
      if (message.status === 'received' && message.receiver) {
        member = this.idPersons.get(message.receiver.value);
      } else if (message.status === 'sent' && message.sender) {
        member = this.idPersons.get(message.sender.value);
      }
      const sessionId = member ? member : this.person;
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, []);
      }

      const session = this.sessions.get(sessionId);
      if (session) {
        session.push(msg);
      }
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

interface DisplayMessage extends Message {
  side?: string;
  senderType?: string;
}
