import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PersonComponent } from './person/person.component';
import {HttpClientModule} from "@angular/common/http";
import {Ng2GoogleChartsModule} from "ng2-google-charts";
import {AppGoogleChartComponent} from "./google-chart/app-google-chart.component";
import { OverlayChartComponent } from './overlay-chart/overlay-chart.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatButtonModule} from "@angular/material/button";
import { LoginComponent } from './login/login.component';
import {MatInputModule} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatDialogModule} from "@angular/material/dialog";
import {FlexLayoutModule} from "@angular/flex-layout";
import { NamePipe } from './pipes/name.pipe';
import {MatTabsModule} from "@angular/material/tabs";
import { GroupsComponent } from './groups/groups.component';
import { GroupComponent } from './group/group.component';
import {MatListModule} from "@angular/material/list";
import { AddPersonComponent } from './add-person/add-person.component';
import { AddGroupComponent } from './add-group/add-group.component';
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCardModule} from "@angular/material/card";
import { BiomarkersComponent } from './biomarkers/biomarkers.component';
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatSelectModule} from "@angular/material/select";
import {MatChipsModule} from "@angular/material/chips";
import {MatTableModule} from "@angular/material/table";
import { TicketsComponent } from './person/tickets/tickets.component';
import { GroupTicketsComponent } from './tickets/tickets.component';
import { ChatComponent } from './person/chat/chat.component';
import {MatCheckboxModule} from "@angular/material/checkbox";
import { SurveyComponent } from './person/survey/survey.component';
import { OpenTicketComponent } from './open-ticket/open-ticket.component';
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSortModule} from "@angular/material/sort";
import { AdminComponent } from './admin/admin.component';
import { NotesComponent } from './person/notes/notes.component';
import { BiometricsComponent } from './person/biometrics/biometrics.component';
import {MatMenuModule} from "@angular/material/menu";
import { AddParentComponent } from './add-parent/add-parent.component';
import { SendMessageComponent } from './send-message/send-message.component';
import { LinkifyPipe } from './pipes/linkify.pipe';
import { AddNoteComponent } from './add-note/add-note.component';
import { AdminChatComponent } from './admin/admin-chat/admin-chat.component';


@NgModule({
  declarations: [
    AppComponent,
    AppGoogleChartComponent,
    PersonComponent,
    OverlayChartComponent,
    LoginComponent,
    NamePipe,
    GroupsComponent,
    GroupComponent,
    AddPersonComponent,
    AddGroupComponent,
    BiomarkersComponent,
    TicketsComponent,
    GroupTicketsComponent,
    ChatComponent,
    SurveyComponent,
    OpenTicketComponent,
    AdminComponent,
    NotesComponent,
    BiometricsComponent,
    AddParentComponent,
    SendMessageComponent,
    LinkifyPipe,
    AddNoteComponent,
    AdminChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    Ng2GoogleChartsModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatButtonModule,
    MatInputModule,
    MatDialogModule,
    FormsModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    MatTabsModule,
    MatListModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatCardModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSelectModule,
    MatChipsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatSortModule,
    MatMenuModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
