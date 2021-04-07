import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
// import { TranslateModule} from "@ngx-translate/core"
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from "@pipes/pipes.module";
import {RouterModule} from '@angular/router';
import { ConnectWallet } from "@components/connect-wallet/connect-wallet.component";
import { AppHeaderComponent } from "@components/app-header/app-header.component";
import { WagerSelectedTokenComponent } from "@components/wager-selected-token/wager-selected-token.component";
import { EventItemComponent } from "@components/event-item/event-item.component";
import { InformationModalComponent } from "@components/information-modal/information-modal.component";
import { WalletOptionsModalComponent } from '@components/wallet-options-modal/wallet-options-modal.component';
import { CryptoAddressDisplayComponent } from '@components/crypto-address-display/crypto-address-display.component';

const components = [
  ConnectWallet,
  AppHeaderComponent,
  WagerSelectedTokenComponent,
  EventItemComponent,
  InformationModalComponent,
  WalletOptionsModalComponent,
  CryptoAddressDisplayComponent
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    // TranslateModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [],
  declarations: components,  
  entryComponents: components,  
  exports: components
})
export class ComponentsModule {}