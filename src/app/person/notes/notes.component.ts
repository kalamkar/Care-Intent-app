import {Component, Input, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  @Input() personId: string | undefined;

  dataSource = new MatTableDataSource();

  private dataSubscription: Subscription | undefined;

  displayedColumns: string[] = ['time', 'note'];

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    if (!this.personId) {
      return;
    }

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    this.dataSubscription = this.api.getMessagesByTag(this.personId, 'session:notes').subscribe(notes => {
      const tableData: any[] = [];
      notes.forEach(row => {
        if (row.content && row.content.toLowerCase().trim() != 'done') {
          tableData.push({time: DateTime.fromISO(row.time), note: row.content});
        }
      });
      this.dataSource.data = tableData;
    });
  }
}
