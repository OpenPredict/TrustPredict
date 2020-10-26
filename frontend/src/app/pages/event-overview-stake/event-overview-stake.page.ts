import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController, ToastController } from '@ionic/angular';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionService } from '@app/services/option-service/option.service';
import { UiService } from '@app/services/ui-service/ui.service';
import { Position } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';

@Component({
  selector: 'app-event-overview-stake',
  templateUrl: './event-overview-stake.page.html',
  styleUrls: ['./event-overview-stake.page.scss'],
})
export class EventOverviewStakePage extends BaseForm implements OnInit {
  
  Position = Position;

  balances = [];

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  get position() {
    const position = this.activatedRoute.snapshot.params.position; // get the position boolean from url
    return (position === '0') ? Position.Right : Position.Left;
  }

  get token() {
    return this.activatedRoute.snapshot.params.token;
  }

  termsAndConditions = 'https://openpredict.io';
  event$ = this.eventsQuery.selectEntity(this.eventId);
  availableOptions: any[];

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private optService: OptionService,
    private ui: UiService,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery,
    private authQuery: AuthQuery,
    private toastCtrl: ToastController) {
      super();
      this.availableOptions = this.optService.availableOptions;

      this.form = this.fb.group({
        option_asset: [this.availableOptions[0], Validators.compose([Validators.required])],
        option_stake: [null, Validators.compose([Validators.required, Validators.min(100), Validators.pattern('^[1-9]+[0-9]*00$')])],
        agreedTerms: [false, Validators.requiredTrue ],
      });

      this.getTokenBalances();
    }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
        map( params => params.get('eventId') ),
        filter(id => !this.eventsQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.eventsService.getEvent(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const numTokensStakedToMint = this.form.controls['option_stake'].value;
    const selection = (this.token === 'IO') ? 0 : 1;

    try {
     const interaction = await this.ui
                             .loading(  this.eventsService.stake(eventId, numTokensStakedToMint, selection),
                             'You will be prompted for 2 contract interactions, please approve both to successfully take part and please be patient as it may take a few moments to broadcast to the network.' )
                             .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );

     if (interaction) {
      this.showStakeSuccess();
    }
    } catch (error) {
      alert(`Error ! ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  getConditionText(): string {
    return this.eventsService.getConditionText(this.position);
  }

  getClass(): string {
    return this.eventsService.getClass(this.position);
  }

  getDate(timestamp: number){
    return this.eventsService.timestampToDate(timestamp);
  }

  async getTokenBalances() {
    const _USER: any  = this.authQuery.getValue();
    const signer: any = _USER.signer;

    const eventId = this.activatedRoute.snapshot.params.eventId;

    const address = await signer.getAddress();
    console.log('address: ' + address);
    this.balances = await this.eventsService.balanceOfAddress(this.eventId, address);
    console.log('balances getTokenBalances: ' + this.balances);
  }

  getRatio(){
    console.log('this.balances: ' + this.balances);

    const selection = (this.token === 'IO') ? 0 : 1;
    const other = 1 - selection;

    // (loser / winner) * 100
    return (this.balances[selection] === 0) ? 0.0 :
           ((this.balances[other] * 1.0 / this.balances[selection]) * 100).toFixed(2);
  }

  // replace with live terms and conditons url
  openTnC() {
    this.ui.openIAB(this.termsAndConditions);
  }

  async showStakeSuccess() {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: 'Success ! Your stake has been placed.'
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }


}
