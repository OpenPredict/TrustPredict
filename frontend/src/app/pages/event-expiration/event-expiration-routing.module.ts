import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventExpirationPage } from './event-expiration.page';

const routes: Routes = [
  {
    path: '',
    component: EventExpirationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventExpirationPageRoutingModule {}
