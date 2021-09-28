import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Ticket, Person} from "../../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-group-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class GroupTicketsComponent implements OnInit, OnChanges {
  @Input() persons: Array<Person> = [];

  dataSource = new MatTableDataSource();
  tableData: PersonTicket[] = [];

  private subscriptions: Array<Subscription> = [];

  displayedColumns: string[] = ['person', 'id', 'open', 'close', 'category', 'title', 'menu'];

  closing: Array<string> = [];

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  init(): void {
    if (!this.persons) {
      return;
    }

    if (this.subscriptions) {
      this.subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      });
    }

    this.dataSource.data = [];
    this.persons.forEach(person => {
      if (person.id) {
        this.subscriptions.push(this.api.getDataByTag(person.id.value, 'ticket', true).subscribe(rows => {
          const tickets = this.getPersonTickets(person, rows);
          this.dataSource.data = this.dataSource.data.concat(tickets);
        }));
      }
    });
  }

  getPersonTickets(person: Person, rows: any[]): Array<any> {
    const tickets = new Map<Number, PersonTicket>();
    this.closing = [];
    rows.forEach(row => {
      let ticket: PersonTicket | undefined;
      row.data.forEach((data: any) => {
        if (data['name'] === 'id' && data['value'] === 'opened') {
          ticket = {person, id: data['number'], open: '', close: '', category: '', title: ''};
          ticket.open = DateTime.fromISO(row.time);
        } else if (data['name'] === 'id' && data['value'] === 'closed') {
          ticket = tickets.get(data['number']);
          if (ticket) {
            ticket.close = DateTime.fromISO(row.time);
          }
        } else if (ticket && data['name'] === 'category') {
          ticket.category = data['value'];
        } else if (ticket && data['name'] === 'title') {
          ticket.title = data['value'];
        }
      });
      if (ticket) {
        tickets.set(ticket.id, ticket);
      }
    });
    return Array.from(tickets.values());
  }

  closeTicket(personId: string, ticketId: number) {
    this.closing.push(personId + ticketId);
    this.api.closeTicket(ticketId, personId).subscribe(response => {
      setTimeout(() => {
        this.init();
      }, 5000);
    });
  }
}


interface PersonTicket extends Ticket {
  person: Person;
}
