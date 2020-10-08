import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventExpiredPageRoutingModule } from './event-expired-routing.module';

import { EventExpiredPage } from './event-expired.page';
import { SharedModule } from '@app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventExpiredPageRoutingModule,
    SharedModule,
  ],
  declarations: [EventExpiredPage]
})
export class EventExpiredPageModule {}
