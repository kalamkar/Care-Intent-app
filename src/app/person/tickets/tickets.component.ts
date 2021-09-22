import {Component, Input, OnInit} from '@angular/core';
import {Ticket} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  @Input() personId: string | undefined;

  dataSource = new MatTableDataSource();

  private ticketsSubscription: Subscription | undefined;

  displayedColumns: string[] = ['id', 'open', 'close', 'category', 'title', 'menu'];

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.ticketsSubscription) {
      this.ticketsSubscription.unsubscribe();
    }

    this.ticketsSubscription = this.api.getDataByTag(this.personId, 'ticket').subscribe(tickets => {
      const tableData = new Map<Number, Ticket>();
      tickets.forEach(t => {
        let ticket: Ticket | undefined;
        t['data'].forEach((data: any) => {
          if (data['name'] === 'id' && data['value'] === 'opened') {
            ticket = {id: data['number'], open: '', close: '', category: '', title: ''};
            ticket.open = DateTime.fromISO(t.time);
          } else if (data['name'] === 'id' && data['value'] === 'closed') {
            ticket = tableData.get(data['number']);
            if (ticket) {
              ticket.close = DateTime.fromISO(t.time);
            }
          } else if (ticket && data['name'] === 'category') {
            ticket.category = data['value'];
          } else if (ticket && data['name'] === 'title') {
            ticket.title = data['value'];
          }
        });
        if (ticket) {
          tableData.set(ticket.id, ticket);
        }
      });
      this.dataSource.data = Array.from(tableData.values());
    });
  }

  closeTicket(ticketId: number) {
    if (this.personId) {
      this.api.closeTicket(ticketId, this.personId).subscribe();
    }
  }
}
