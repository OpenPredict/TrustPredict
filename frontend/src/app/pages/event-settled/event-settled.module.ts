import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventSettledPageRoutingModule } from './event-settled-routing.module';

import { EventSettledPage } from './event-settled.page';
import { SharedModule } from '@app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventSettledPageRoutingModule,
    SharedModule,
  ],
  declarations: [EventSettledPage]
})
export class EventSettledPageModule {}
