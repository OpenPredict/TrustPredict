import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectTokenPage } from './select-token.page';

const routes: Routes = [
  {
    path: '',
    component: SelectTokenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectTokenPageRoutingModule {}
