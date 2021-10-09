import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
// @ts-ignore
import { DateTime } from 'luxon';
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-biometrics',
  templateUrl: './biometrics.component.html',
  styleUrls: ['./biometrics.component.scss']
})
export class BiometricsComponent implements OnInit, AfterViewInit {
  @Input() personId: string | undefined;

  dataSource = new MatTableDataSource();
  @ViewChild(MatSort) sort: MatSort | undefined;

  private dataSubscription: Subscription | undefined;

  displayedColumns: string[] = ['time', 'data', 'value'];

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

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    this.dataSubscription = this.api.getDataByTag(this.personId, 'biometrics').subscribe(rows => {
      const tableData: any[] = [];
      rows.forEach(row => {
        row.data.forEach((data: {name: string, number?: number, value:string}) => {
          tableData.push({time: DateTime.fromISO(row.time), data: data.name,
            value: data.number ? data.number : data.value});
        });
      });
      this.dataSource.data = tableData;
    });
  }
}
