import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConnectWalletPage } from './connect-wallet.page';

const routes: Routes = [
  {
    path: '',
    component: ConnectWalletPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConnectWalletPageRoutingModule {}
