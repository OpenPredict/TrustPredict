import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventOverviewPage } from './event-overview.page';

const routes: Routes = [
  {
    path: '',
    component: EventOverviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventOverviewPageRoutingModule {}
