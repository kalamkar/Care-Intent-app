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
import {FormsModule} from "@angular/forms";
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
    AddGroupComponent
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
    MatListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
