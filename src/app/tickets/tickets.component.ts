import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Ticket, Person} from "../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-group-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class GroupTicketsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() persons: Array<Person> = [];

  dataSource = new MatTableDataSource();
  tableData: PersonTicket[] = [];

  @ViewChild(MatSort) sort: MatSort | undefined;

  private subscriptions: Array<Subscription> = [];

  displayedColumns: string[] = ['person', 'id', 'priority', 'open', 'close', 'category', 'title'];

  closing: Array<string> = [];

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
          ticket = {person, id: data['number'], open: '', close: '', category: '', title: '', priority: 0};
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
        } else if (ticket && data['name'] === 'priority') {
          ticket.priority = data['number'];
        }
      });
      if (ticket) {
        tickets.set(ticket.id, ticket);
      }
    });
    return Array.from(tickets.values());
  }
}


interface PersonTicket extends Ticket {
  person: Person;
}
