import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventExpirationPageRoutingModule } from './event-expiration-routing.module';

import { EventExpirationPage } from './event-expiration.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventExpirationPageRoutingModule,
    SharedModule
  ],
  declarations: [EventExpirationPage]
})
export class EventExpirationPageModule {}
