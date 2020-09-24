import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaunchOptionPageRoutingModule } from './launch-option-routing.module';

import { LaunchOptionPage } from './launch-option.page';
import { SharedModule } from "@app/shared.module";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaunchOptionPageRoutingModule,
    SharedModule
  ],
  declarations: [LaunchOptionPage]
})
export class LaunchOptionPageModule {}
