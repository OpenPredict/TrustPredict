import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import { parse } from 'path';
import { CustomValidators } from '@app/helpers/CustomValidators';

@Component({
  selector: 'app-event-condition',
  templateUrl: './event-condition.page.html',
  styleUrls: ['./event-condition.page.scss'],
})
export class EventConditionPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  formattedAmount: any;
  dollarMask = BaseForm.dollarMask;

  modalHeader = "Header will be in the H1 tag of the modal"
  modalTxt = "<p>RAW HTML tags</p><br><p>Dont forget the p tags</p>"  
    
  
  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
    public navCtrl: NavController ) {
      super();
      this.form = this.fb.group({
        wager: ['null', Validators.compose([Validators.required, Validators.minLength(1)])],
        condition: ['1', Validators.compose([Validators.required])],
      });
      this.form.get('wager').setValidators([CustomValidators.numberRange(0.01, Number.MAX_VALUE)]);
    }

    ngOnInit() {}

    continue() {
      this.setSubmitted();
      if (!this.form.valid) {
        return;
      }
      try {
        const condition_price = BaseForm.transformAmount(this.form.controls['wager'].value);
        console.log(`Sending over the wire ${condition_price} ${typeof condition_price}`);
        const condition = (this.form.controls['condition'].value === '1') ? true : false;
        this.optStr.upsert(1, { condition_price, condition } );
        this.navCtrl.navigateForward([`/event-expiration`]);
      } catch (error) {
        console.log(`Error: ${error}`);
       }
    }

    goBack() {
      this.navCtrl.back();
    }

}
