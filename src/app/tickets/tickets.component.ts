import {AfterViewInit, Component, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Ticket, Person} from "../model/model";
import {Subscription} from "rxjs";
import {ApiService} from "../services/api.service";
import {MatTableDataSource} from "@angular/material/table";
// @ts-ignore
import { DateTime } from 'luxon';
import {MatSort} from "@angular/material/sort";
import {MatCheckbox} from "@angular/material/checkbox";

@Component({
  selector: 'app-group-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class GroupTicketsComponent implements OnInit, OnChanges, AfterViewInit {
  readonly ALL_COLUMNS: string[] = ['person', 'priority', 'open', 'close', 'id', 'category', 'title'];

  @Input() persons: Array<Person> = [];
  @Output() count = 0;

  dataSource = new MatTableDataSource();
  allTickets: Array<any> = [];
  personTickets = new Map<Person, Array<Ticket>>();
  maxPerson!: Person;
  maxTicketId!: number;

  @ViewChild(MatSort) sort!: MatSort;

  private subscriptions: Array<Subscription> = [];

  showClosed = false;
  displayedColumns: string[] = this.ALL_COLUMNS.filter(name => name !== 'close');

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

    this.allTickets = [];
    this.persons.forEach(person => {
      if (person.id) {
        this.subscriptions.push(this.api.getDataByTag(person.id.value, 'ticket').subscribe(rows => {
          const tickets = this.getPersonTickets(person, rows);
          this.allTickets = this.allTickets.concat(tickets);
          this.personTickets.set(person, tickets);
          this.updateTable();
        }));
      }
    });
  }

  updateTable() {
    this.displayedColumns = this.showClosed ? this.ALL_COLUMNS : this.ALL_COLUMNS.filter(name => name !== 'close');
    this.dataSource.data = this.allTickets.filter(t => this.showClosed || t.close === '');
    this.count = this.dataSource.data.length;
    this.getTopTicket();
  }

  getTopTicket() {
    let maxScore = 0;
    this.personTickets.forEach((tickets, person) => {
      if (tickets.length === 0) {
        return;
      }

      tickets = tickets.filter(ticket => ticket.close === '');
      const m = this.median(tickets.map(ticket => ticket.priority));
      if (m > maxScore) {
        this.maxPerson = person;
        maxScore = m;
        const sortedTickets = tickets.sort((a, b) => b.priority - a.priority);
        this.maxTicketId = sortedTickets[0].id;
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

  median(arr: Array<number>) {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };
}


interface PersonTicket extends Ticket {
  person: Person;
}
