import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
// @ts-ignore
import { DateTime } from 'luxon';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss']
})
export class SurveyComponent implements OnInit {
  @Input() personId: string | undefined;

  dataSource = new MatTableDataSource();

  private dataSubscription: Subscription | undefined;

  displayedColumns: string[] = ['time', 'question', 'answer'];

  surveys = [
    {value: '', viewValue: 'All'},
    {value: 'survey.covid', viewValue: 'Covid'},
    {value: 'survey.phq9', viewValue: 'PHQ-9'}
  ];

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

    this.dataSubscription = this.api.getDataByTag(this.personId, 'survey').subscribe(answers => {
      const tableData: any[] = [];
      answers.forEach(t => {
        tableData.push({time: DateTime.fromISO(t.time), question: t.data[0]['name'], answer: t.data[0]['value']});
      });
      this.dataSource.data = tableData;
    });
  }
}
