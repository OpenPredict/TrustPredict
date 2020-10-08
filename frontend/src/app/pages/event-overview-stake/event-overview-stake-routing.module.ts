import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventOverviewStakePage } from './event-overview-stake.page';

const routes: Routes = [
  {
    path: '',
    component: EventOverviewStakePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventOverviewStakePageRoutingModule {}
