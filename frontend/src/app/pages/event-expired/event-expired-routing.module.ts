import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventExpiredPage } from './event-expired.page';

const routes: Routes = [
  {
    path: '',
    component: EventExpiredPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventExpiredPageRoutingModule {}
