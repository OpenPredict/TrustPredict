import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventOverviewStakePageRoutingModule } from './event-overview-stake-routing.module';

import { EventOverviewStakePage } from './event-overview-stake.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventOverviewStakePageRoutingModule,
    SharedModule
  ],
  declarations: [EventOverviewStakePage]
})
export class EventOverviewStakePageModule {}
