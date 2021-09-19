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
  @ViewChild('host', {static: true}) host: ElementRef | undefined;

  isLoading = true;
  sessions = new Array<Message[]>();

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
          let sessionStartTime = startTime;
          let sessionId: string = sessionStartTime.toFormat('DDD');
          messages.forEach((message: Message) => {
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
          this.isLoading = false;
        },
        error => {
          this.isLoading = false;
        }
      );
  }

  scrollToBottom = () => {
    try {
      // @ts-ignore
      this.host.nativeElement.scrollTop = this.host.nativeElement.scrollHeight;
    } catch (err) {
      console.log(err);
    }
  };
}
