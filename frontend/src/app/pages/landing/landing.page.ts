import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  styleUrls: ['landing.page.scss'],
})
export class LandingPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  availablePairs: {};

  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
    public navCtrl: NavController ) {
      super();

      this.availablePairs = this.optService.availablePairs;

      this.form = this.fb.group({
        asset: [
                this.availablePairs['0x5813A90f826e16dB392abd2aF7966313fc1fd5B8'],
                Validators.compose([Validators.required])
        ]
      });
    }

  ngOnInit() {}

  continue() {
    this.setSubmitted();
    const selectedPair = this.form.controls['asset'].value;
    const pair = selectedPair.pair;
    const pair_contract = selectedPair.pair_contract;

    const item = { pair: pair, pair_contract: pair_contract };
    if (!this.form.valid && pair && pair_contract ) {
      return;
    }
    try {
      this.optStr.upsert(1, item);
      this.navCtrl.navigateForward([`/event-condition`]);
    } catch (error) {
      console.log(`Error: ${error}`);
      }
  }

}
