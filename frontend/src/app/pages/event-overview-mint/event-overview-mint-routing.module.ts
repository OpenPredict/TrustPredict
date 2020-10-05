import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventOverviewMintPage } from './event-overview-mint.page';

const routes: Routes = [
  {
    path: '',
    component: EventOverviewMintPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventOverviewMintPageRoutingModule {}
