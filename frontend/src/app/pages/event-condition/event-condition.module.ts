import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventConditionPageRoutingModule } from './event-condition-routing.module';

import { EventConditionPage } from './event-condition.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventConditionPageRoutingModule,
    SharedModule
  ],
  declarations: [EventConditionPage]
})
export class EventConditionPageModule {}
