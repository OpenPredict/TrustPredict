import { Component, OnInit, ViewChild } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import {  FormBuilder, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { AppHeaderComponent } from "@components/app-header/app-header.component";
const axios = require('axios');

@Component({
  selector: 'app-event-condition',
  templateUrl: './event-condition.page.html',
  styleUrls: ['./event-condition.page.scss'],
})
export class EventConditionPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  formattedAmount: any;
  dollarMask = BaseForm.dollarMask;
  @ViewChild("header") header: AppHeaderComponent;

  modalHeader = 'Choosing Event Conditions'
  modalTxt = `
    <p>
      Choose the price at which you think the currency pairing will settle at (in USD terms), and whether or
      not you think the final settlement price will be higher than or lower than your chosen price.
    </p>`;


  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
    public navCtrl: NavController) {
    super();
    this.form = this.fb.group({
      wager: ['null', Validators.compose([Validators.required, Validators.minLength(1)])],
      condition: ['1', Validators.compose([Validators.required])],
    });
    this.form.get('wager').setValidators([CustomValidators.numberRange(0.01, Number.MAX_VALUE)]);
  }

  ngOnInit() { }

  async getPrice(address) {
    const response = await axios({
          baseURL: `https://kovan.etherscan.io/readContract?m=normal&a=${address}&v=0x44D01B3F44E8351E60296bdF57B27CF2659B0200#`,
      method: 'post',
      });
      return response;
  };

  continue() {
    this.setSubmitted();
    if (!this.form.valid) {
      return;
    }
    try {
      const condition_price = BaseForm.transformAmount(this.form.controls['wager'].value);
      console.log(`Sending over the wire ${condition_price} ${typeof condition_price}`);
      const condition = (this.form.controls['condition'].value === '1') ? true : false;
      this.optStr.upsert(1, { condition_price, condition });
      this.navCtrl.navigateForward([`/event-expiration`]);
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  information() {
    this.header.information();
  }

}
