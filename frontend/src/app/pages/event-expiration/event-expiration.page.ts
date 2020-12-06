import { Component, OnInit } from "@angular/core";
import { OptionService } from "@services/option-service/option.service";
import { NavController } from "@ionic/angular";
import { Observable } from "rxjs";
import { OptionQuery } from "@services/option-service/option.service.query";
import { BaseForm } from "@app/helpers/BaseForm";
import { FormBuilder, Validators } from "@angular/forms";
import { OptionsStore } from "@app/services/option-service/option.service.store";
import * as moment from "moment";
import { ThemePalette } from "@angular/material/core";
import {
  NGX_MAT_DATE_FORMATS,
  NgxMatDateAdapter
} from "@angular-material-components/datetime-picker";
import { NgxMatMomentAdapter } from '@angular-material-components/moment-adapter';

export const CUSTOM_MOMENT_FORMATS = {
  parse: {
    dateInput: "l, LT"
  },
  display: {
    dateInput: "lll",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY"
  }
};

@Component({
  selector: "app-event-expiration",
  templateUrl: "./event-expiration.page.html",
  styleUrls: ["./event-expiration.page.scss"],
  providers: [
    { provide: NGX_MAT_DATE_FORMATS, useValue: CUSTOM_MOMENT_FORMATS },
    { provide: NgxMatDateAdapter, useClass: NgxMatMomentAdapter },
  ]
})
export class EventExpirationPage extends BaseForm implements OnInit {
  loading$: Observable<boolean>;

  min: string;

  modalHeader = "Event Settlement";
  modalTxt = `
    <p>
      Choose a date at which you would like the event to settle. It is at this time that your event will
      'finalize': the event will receive the current price of the asset at the time you choose here.
    </p>`;

  public date: moment.Moment;
  public minDate: moment.Moment;
  public maxDate: moment.Moment;
  public color: ThemePalette = "primary";

  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
    public navCtrl: NavController
  ) {
    super();
    this.form = this.fb.group({
      expiration_date: [this.date, Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
    this.min = moment().add(2, "days").toISOString();
  }

  continue() {
    this.setSubmitted();
    if (!this.form.valid) {
      return;
    }
    try {
      const expiry = this.form.controls["expiration_date"].value;
      const a = moment();
      const b = moment(expiry);
      const seconds = a.diff(b, "seconds");
      this.optStr.upsert(1, { expiration_date: Number(Math.abs(seconds)) });
      this.navCtrl.navigateForward([`/launch-option`]);
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }
}
