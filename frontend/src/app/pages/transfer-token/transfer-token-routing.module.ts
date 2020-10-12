import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransferTokenPage } from './transfer-token.page';

const routes: Routes = [
  {
    path: '',
    component: TransferTokenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransferTokenPageRoutingModule {}
