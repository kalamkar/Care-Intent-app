import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonComponent} from "./person/person.component";
import {GroupComponent} from "./group/group.component";

const routes: Routes = [
  {path: 'person/:id', component: PersonComponent},
  {path: 'group/:id', component: GroupComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
