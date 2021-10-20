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
  sumOfAnswers = 0;

  private dataSubscription: Subscription | undefined;

  displayedColumns: string[] = ['time', 'question', 'answer'];

  surveys = new Map<string, any>([
    ['', {title: 'All', score: false}],
    ['survey.covid', {title: 'Covid', score: false}],
    ['survey.phq9', {title: 'PHQ-9', score: true}]
  ]);

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

  updateScore() {
    this.sumOfAnswers = 0;
    this.dataSource.data.forEach((row: any) => {
      if (row.question && row.question.indexOf(this.dataSource.filter) < 0) {
        return;
      }
      this.sumOfAnswers += !isNaN(parseInt(row.answer)) ? parseInt(row.answer) : 0;
    });
  }
}
