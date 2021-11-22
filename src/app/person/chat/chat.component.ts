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
import {FormControl, FormGroup} from "@angular/forms";


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() person: Person | undefined;
  @ViewChildren('messages') messagesView: QueryList<any> | undefined;
  @ViewChild('sessionsView', {static: true}) sessionsView: ElementRef | undefined;

  range = new FormGroup({
    start: new FormControl(DateTime.local().plus({days: 1}).endOf('day').minus({days: 90}).toJSDate()),
    end: new FormControl(DateTime.local().plus({days: 1}).endOf('day').toJSDate()),
  });

  isLoading = true;
  sessions = new Array<DisplayMessage[]>();

  senderTypes = ['Member', 'Coach', 'System'];

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

  init(noCache = false): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.sessions = [];
    if (!this.person || !this.person.id || !this.range.value.start || !this.range.value.end) {
      return;
    }

    this.isLoading = true;
    const endTime = DateTime.fromJSDate(this.range.value.end);
    const startTime = DateTime.fromJSDate(this.range.value.start);
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
    this.sessions = [[]];
    let lastMessageTime = DateTime.local().minus({days: 15});
    let sessionId: string = '';
    messages.forEach((message: Message) => {
      const msg: DisplayMessage = message;
      let hasSessionTag = false;
      let hasCommandTag = false;
      message.tags.forEach(tag => {
        hasSessionTag = hasSessionTag || tag.startsWith('session:');
        hasCommandTag = hasCommandTag || tag.startsWith('command.');
      });
      if (message.status === 'received' && this.person && this.person.id
          && message.receiver.value !== this.person.id.value) {
        msg.senderType = 'Member';
        msg.side = 'left';
      } else if (message.status === 'received' && !hasCommandTag) {
        msg.senderType = 'Coach';
        msg.side = 'right';
      } else if (message.status === 'sent' && !message.tags.includes('proxy')) {
        msg.senderType = 'System';
        msg.side = 'right';
      } else {
        return;
      }
      const messageTime = DateTime.fromISO(message.time);
      const sessionIds = message.tags.filter(tag => tag.startsWith('session:'));
      if ((sessionIds && sessionIds[0] !== sessionId) || messageTime.minus({minutes: 60}) > lastMessageTime) {
        sessionId = sessionIds[0];
        this.sessions.push([]);
      }

      this.sessions[this.sessions.length - 1].push(msg);
      lastMessageTime = messageTime;
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
