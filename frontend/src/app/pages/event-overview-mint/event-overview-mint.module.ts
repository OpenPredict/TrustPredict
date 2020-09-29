import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventOverviewMintPageRoutingModule } from './event-overview-mint-routing.module';

import { EventOverviewMintPage } from './event-overview-mint.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventOverviewMintPageRoutingModule,
    SharedModule
  ],
  declarations: [EventOverviewMintPage]
})
export class EventOverviewMintPageModule {}
