import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController, ToastController } from '@ionic/angular';
import { OptionQuery } from '@services/option-service/option.service.query';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { CryptoService } from '@app/services/crypto-service/crypto.service';
import { UiService } from '@services/ui-service/ui.service';
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';
import { CustomValidators } from '@app/helpers/CustomValidators';

@Component({
  selector: 'app-launch-option',
  templateUrl: './launch-option.page.html',
  styleUrls: ['./launch-option.page.scss'],
})
export class LaunchOptionPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;

  availableOptions: any[];

  dollarMask = createNumberMask({
    prefix: '$ ',
    suffix: '', // This will put the dollar sign at the end, with a space.
    allowDecimal: true,
    decimalSymbol: '.',
  });

  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    public opEvent: OpEventService,
    private optStr: OptionsStore,
    public toastCtrl: ToastController,
    public ui: UiService,
    private crypto: CryptoService,
    public navCtrl: NavController ) {
      super();

      this.availableOptions = this.optService.availableOptions;

      this.form = this.fb.group({
        option_asset: [this.availableOptions[0], Validators.compose([Validators.required])],
        option_stake: [null, Validators.compose([Validators.required])],
      });

      this.form.get('option_stake').setValidators([CustomValidators.minimumNumber(100)]);
    }

  ngOnInit() {}

  async continue() {

      const option_asset = this.form.controls['option_asset'].value;
      const option_stake = BaseForm.transformAmount(this.form.controls['option_stake'].value);
      const item = { option_asset: option_asset.pair_contract, option_stake };
      this.optStr.upsert(1, item); // update the state object first

      const currentOptions = this.optQry.getAll();
      const betSide = currentOptions[0].condition;
      const eventPeriod = currentOptions[0].expiration_date;
      const numTokensStakedToMint = currentOptions[0].option_stake;
      const rawBetPrice = currentOptions[0].condition_price;
      const pairContract = currentOptions[0].pair_contract;

      console.log('betSide: ' + betSide);
      console.log('eventPeriod: ' + eventPeriod);
      console.log('numTokensStakedToMint: ' + numTokensStakedToMint);
      console.log('rawBetPrice: ' + rawBetPrice);
      console.log('pairContract: ' + pairContract);

      try {
       const interaction = await this.ui
                               .loading(  this.opEvent.launchEvent(rawBetPrice, betSide, eventPeriod, numTokensStakedToMint, pairContract),
                               'You will be prompted for 3 contract interactions, please approve all to successfully take part and please be patient as it may take a few moments to broadcast to the network.' )
                               .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );

       if (interaction) {
           this.showWagerSuccess();
        }
      } catch (error) {
        alert(`Error ! ${error}`);
      }
  }

  goBack() {
    this.navCtrl.back();
  }

  async showWagerSuccess() {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: 'Success ! Your wager has been placed'
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }

}
