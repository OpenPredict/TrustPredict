import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventOverviewPageRoutingModule } from './event-overview-routing.module';

import { EventOverviewPage } from './event-overview.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventOverviewPageRoutingModule,
    SharedModule
  ],
  declarations: [EventOverviewPage]
})
export class EventOverviewPageModule {}
