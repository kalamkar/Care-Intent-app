import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {Ticket} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit, AfterViewInit {
  @Input() personId: string | undefined;

  dataSource = new MatTableDataSource();
  @ViewChild(MatSort) sort: MatSort | undefined;

  private ticketsSubscription: Subscription | undefined;

  displayedColumns: string[] = ['id', 'priority', 'open', 'close', 'category', 'title', 'menu'];

  closing: Array<number> = [];

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.ticketsSubscription) {
      this.ticketsSubscription.unsubscribe();
    }

    this.ticketsSubscription = this.api.getDataByTag(this.personId, 'ticket', true).subscribe(tickets => {
      const tableData = new Map<Number, Ticket>();
      this.closing = [];
      tickets.forEach(t => {
        let ticket: Ticket | undefined;
        t['data'].forEach((data: any) => {
          if (data['name'] === 'id' && data['value'] === 'opened') {
            ticket = {id: data['number'], open: '', close: '', category: '', title: '', priority: 0};
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
          } else if (ticket && data['name'] === 'priority') {
            ticket.priority = data['number'];
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
      this.closing.push(ticketId);
      this.api.closeTicket(ticketId, this.personId).subscribe(response => {
        setTimeout(() => {
          this.init();
        }, 5000);
      });
    }
  }
}
