import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {Ticket} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {MatTable, MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit, AfterViewInit {
  readonly ALL_COLUMNS: string[] = ['priority', 'open', 'close', 'id', 'category', 'title', 'menu'];
  @Input() personId: string | undefined;

  allTickets: Array<any> = [];
  dataSource = new MatTableDataSource();
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('table') table!: MatTable<any>;

  private ticketsSubscription: Subscription | undefined;

  showClosed: boolean = false;
  displayedColumns: string[] = this.ALL_COLUMNS.filter(name => name !== 'close');

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

  init(noCache = false): void {
    if (!this.personId) {
      return;
    }

    if (this.ticketsSubscription) {
      this.ticketsSubscription.unsubscribe();
    }

    this.ticketsSubscription = this.api.getDataByTag(this.personId, 'ticket', noCache || undefined)
          .subscribe(tickets => {
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
      this.allTickets = Array.from(tableData.values());
      this.updateTable();
    });
  }


  updateTable() {
    this.displayedColumns = this.showClosed ? this.ALL_COLUMNS : this.ALL_COLUMNS.filter(name => name !== 'close');
    this.dataSource.data = this.allTickets.filter(t => this.showClosed || t.close === '');
  }


  closeTicket(ticketId: number) {
    if (this.personId) {
      this.closing.push(ticketId);
      this.api.closeTicket(ticketId, this.personId).subscribe(response => {
        setTimeout(() => {
          this.init(true);
        }, 5000);
      });
    }
  }
}
