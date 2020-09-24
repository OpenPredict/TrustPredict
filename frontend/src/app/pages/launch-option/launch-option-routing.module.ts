import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaunchOptionPage } from './launch-option.page';

const routes: Routes = [
  {
    path: '',
    component: LaunchOptionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaunchOptionPageRoutingModule {}
