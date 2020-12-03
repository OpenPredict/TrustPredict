import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";

import { EventExpirationPageRoutingModule } from "./event-expiration-routing.module";

import { EventExpirationPage } from "./event-expiration.page";
import { SharedModule } from "@app/shared.module";
import { MatDatepickerModule } from "@angular/material/datepicker";
import {
  NgxMatDatetimePickerModule,
  NgxMatTimepickerModule,
  NgxMatNativeDateModule
} from "@angular-material-components/datetime-picker";
import { MatInputModule } from "@angular/material/input";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventExpirationPageRoutingModule,
    SharedModule,
    MatDatepickerModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    MatInputModule
  ],
  declarations: [EventExpirationPage]
})
export class EventExpirationPageModule {}
