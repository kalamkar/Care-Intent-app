import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
// @ts-ignore
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs/internal/Subscription';
import { Identifier, Message, Person } from '../../model/model';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-person-chat',
  templateUrl: './person-chat.component.html',
  styleUrls: ['./person-chat.component.scss']
})
export class PersonChatComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() person: Person | undefined;
  @ViewChildren('messages') messagesView: QueryList<any> | undefined;
  @ViewChild('content', {static: true}) content: ElementRef | undefined;

  isLoading = true;
  enableLoadMore = false;
  isSendingMsg = false;

  messages: Array<Message> = [];
  messagesByDate = new Map<string, Message[]>();

  newMessage = '';

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
    if (this.messagesViewSubscription) {
      this.messagesViewSubscription.unsubscribe();
    }
  }

  onTabSelected(): void {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    if (!this.content) {
      return;
    }
    try {
      this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight;
    } catch (err) {
    }
  };

  init(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.messagesByDate.clear();
    if (!this.person) {
      return;
    }
    this.messages = [];
    this.loadData();
  }

  loadData(loadMore = false): void {
    if (!this.person || !this.person.id || !this.content) {
      return;
    }
    this.isLoading = true;
    const scrollHeight = this.content.nativeElement.scrollHeight;
    const endTime = loadMore && this.messages[0] ?
      this.messages[0].time : DateTime.local().plus({days: 1}).endOf('day');
    const startTime = endTime.minus({days: 15});
    this.messagesSubscription = this.api.getMessages(this.person.id.value, startTime, endTime, true)
      .subscribe((activities: Message[]) => {
        this.enableLoadMore = activities.length === 30;
        const msgs = activities.filter(msg => msg.status !== 'queued');
        this.messages.push(...msgs);
        this.messages.sort((a: Message, b: Message) =>
            DateTime.fromISO(a.time).toMillis() - DateTime.fromISO(b.time).toMillis());
        this.messagesByDate.clear();
        this.messages.forEach((message: Message) => {
          const keyDate = DateTime.fromISO(message.time);
          let key = keyDate.toFormat('DDD');
          if (keyDate.hasSame(DateTime.local(), 'day')) {
            key = 'TODAY';
          } else if (keyDate.hasSame(DateTime.local().minus({day: 1}), 'day')) {
            key = 'YESTERDAY';
          }
          const messages = this.messagesByDate.get(key);
          if (messages) {
            messages.push(message);
          } else {
            this.messagesByDate.set(key, [message]);
          }
        });
        this.isLoading = false;
        if (loadMore) {
          setTimeout(() => {
            if (this.content) {
              this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight - scrollHeight;
            }
          }, 100);

        }
      },
      error => {
        this.isLoading = false;
      }
    );
  }

  refreshChat(): void {
    this.isLoading = true;
    this.init();
  }

  keepOrder<T>(a: T, b: T): T {
    return a;
  }
}
