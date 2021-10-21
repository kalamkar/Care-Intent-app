import {Component, Input} from '@angular/core';
import {Group} from "../model/model"

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent {

  @Input() groups: Array<Group> = [];


  constructor() { }
}
