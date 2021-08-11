import {Component, Input, OnInit} from '@angular/core';
import {Message} from "../../model/model";
import {ApiService} from "../../services/api.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-message-queue',
  templateUrl: './message-queue.component.html',
  styleUrls: ['./message-queue.component.scss']
})
export class MessageQueueComponent implements OnInit {
  @Input() personId: string | undefined;

  messages = new Array<Message>();

  private messagesSubscription: Subscription | undefined;

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }

    this.messagesSubscription = this.api.getAllResources(['person', this.personId, 'message']).subscribe(messages => {
      this.messages = messages.filter((message: Message) => message.status === 'queued');
    });
  }
}
