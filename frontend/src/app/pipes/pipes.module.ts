import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TrimAddressPipe } from "@pipes/trim-address/trim-address.pipe";

const pipes = [
    TrimAddressPipe
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
  ],
  declarations: pipes,  
  exports: pipes
})
export class PipesModule {}