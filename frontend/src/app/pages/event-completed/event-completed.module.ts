import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventCompletedPageRoutingModule } from './event-completed-routing.module';

import { EventCompletedPage } from './event-completed.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventCompletedPageRoutingModule,
    SharedModule,
  ],
  declarations: [EventCompletedPage]
})
export class EventCompletedPageModule {}
