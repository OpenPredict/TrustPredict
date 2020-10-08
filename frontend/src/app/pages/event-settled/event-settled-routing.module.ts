import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventSettledPage } from './event-settled.page';

const routes: Routes = [
  {
    path: '',
    component: EventSettledPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventSettledPageRoutingModule {}
