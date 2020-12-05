import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyEventsPageRoutingModule } from './my-events-routing.module';

import { MyEventsPage } from './my-events.page';
import { SharedModule } from "@app/shared.module";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyEventsPageRoutingModule,
    SharedModule,
    MatProgressSpinnerModule
  ],
  declarations: [MyEventsPage]
})
export class MyEventsPageModule { }
