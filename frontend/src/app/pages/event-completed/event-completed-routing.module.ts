import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventCompletedPage } from './event-completed.page';

const routes: Routes = [
  {
    path: '',
    component: EventCompletedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventCompletedPageRoutingModule {}
