import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PersonComponent} from "./person/person.component";
import {GroupComponent} from "./group/group.component";
import {AdminComponent} from "./admin/admin.component";

const routes: Routes = [
  {path: 'person/:id', component: PersonComponent},
  {path: 'admin/:id', component: AdminComponent},
  {path: 'group/:id', component: GroupComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
