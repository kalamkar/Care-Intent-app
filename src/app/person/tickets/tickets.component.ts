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

  displayedColumns: string[] = ['id', 'time', 'category', 'title', 'status'];

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
      const tableData: any = [];
      tickets.forEach(t => {
        let ticket: Ticket = {id: 0, time: DateTime.fromISO(t.time), category: '', title: '', status: ''};
        t['data'].forEach((data: any) => {
          if (data['name'] === 'id') {
            ticket.id = data['number'];
            ticket.status = data['value'];
          } else if (data['name'] === 'category') {
            ticket.category = data['value'];
          } else if (data['name'] === 'title') {
            ticket.title = data['value'];
          }
        });
        if (ticket.id > 0) {
          tableData.push(ticket);
        }
      });
      this.dataSource.data = tableData;
    });
  }
}
