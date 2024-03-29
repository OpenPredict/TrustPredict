import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { LandingPage } from './landing.page';

import { LandingPageRoutingModule } from './landing-routing.module';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LandingPageRoutingModule,
    SharedModule,
  ],
  declarations: [LandingPage]
})
export class LandingPageModule {}
