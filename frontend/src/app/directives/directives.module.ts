import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
// import { TranslateModule} from "@ngx-translate/core"
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from "@pipes/pipes.module";
import {RouterModule} from '@angular/router';
import { CurrencyMaskDirective } from "@directives/currency-mask/currency-mask.directive";


const directives = [
    CurrencyMaskDirective
]


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    // TranslateModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [],
  declarations: directives,  
  exports: directives
})
export class DirectivesModule {}