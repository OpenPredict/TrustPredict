import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventConditionPage } from './event-condition.page';

const routes: Routes = [
  {
    path: '',
    component: EventConditionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventConditionPageRoutingModule {}
