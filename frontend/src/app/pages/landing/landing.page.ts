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

  modalHeader = 'Welcome to TrustPredict!';
  modalTxt = `
      <p>
        This app allows you to create a prediction on the price of various currency pairs, at a price and time chosen by
        you, the deployer.
      <p>
        Other users may then 'stake' on your event, that is, place a wager for or against your prediction. For complete info
        on the protocol, please see our <a target="_blank" href="https://openpredict.io/litepaper">litepaper</a>.
      </p>
      <p>
        To proceed, please ensure that:
        <ul>
          <li> You are connected to the Kovan test network in MetaMask </li>
          <li> You have some of the following tokens:
            <ul>
              <li><a target="_blank" href="https://faucet.kovan.network/">kETH</a></li>
              <li><a target="_blank" href="https://kovan.chain.link/">LINK</a></li>
              <li><a target="_blank" href="http://kovan.openpredict.io/">OPUSD</a></li>
            </ul>
          </li>
        </ul>
      </p>
      <p>
        On this screen, you may choose from a list of currency pairs in the dropdown list. Just click on the list under <b>Select Asset</b>
        and choose a pair.
      </p>`;


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
