import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConnectWalletPageRoutingModule } from './connect-wallet-routing.module';

import { ConnectWalletPage } from './connect-wallet.page';
import { SharedModule } from "@app/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConnectWalletPageRoutingModule,
    SharedModule
  ],
  declarations: [ConnectWalletPage]
})
export class ConnectWalletPageModule {}
