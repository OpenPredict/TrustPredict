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
import { CustomValidators } from '@app/helpers/CustomValidators';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';
import { StakingBalanceQuery } from '@app/services/staking-balance-service/staking-balance.service.query';
import { ethers } from 'ethers';

@Component({
  selector: 'app-event-overview-stake',
  templateUrl: './event-overview-stake.page.html',
  styleUrls: ['./event-overview-stake.page.scss'],
})
export class EventOverviewStakePage extends BaseForm implements OnInit {

  Position = Position;
  dollarMask = BaseForm.dollarMask;

  modalHeader = "Header will be in the H1 tag of the modal"
  modalTxt = "<p>RAW HTML tags</p><br><p>Dont forget the p tags</p>"  
    
  
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
  opBalance$ = this.opBalancesQuery.selectEntity(this.eventId);
  stakingBalance$ = this.stakingBalanceQuery.select();
  availableOptions: any[];

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private optService: OptionService,
    private ui: UiService,
    private eventsService: OpEventService,
    private balancesService: OpBalanceService,
    private optionService: OptionService,
    private eventsQuery: OpEventQuery,
    private opBalancesQuery: OpBalanceQuery,
    private stakingBalanceQuery: StakingBalanceQuery,
    private toastCtrl: ToastController) {
      super();
      this.availableOptions = this.optService.availableOptions;

      this.form = this.fb.group({
        option_asset: [this.availableOptions[0], Validators.compose([Validators.required])],
        option_stake: [null, Validators.compose([Validators.required])],
        agreedTerms: [false, Validators.requiredTrue ],
      });

      this.stakingBalance$.subscribe( stakingBalance => {
        console.log('stakingBalance updated:' + JSON.stringify(stakingBalance));
        console.log(this.getBalance(stakingBalance));

        this.form.get('option_stake').setValidators(
            [CustomValidators.numberRange(0.01, parseFloat( this.getBalance(stakingBalance) ))]
          );
      });
    }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
        map( params => params.get('eventId') ),
        filter(id => !this.eventsQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.eventsService.getEvent(id))
      ).subscribe();

    this.activatedRoute.paramMap.pipe(
        map( params => params.get('eventId') ),
        filter(id => !this.opBalancesQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.balancesService.getBalance(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    console.log('in continue');
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const numTokensStakedToMint = BaseForm.transformAmount(this.form.controls['option_stake'].value);
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

  currencyFormat(price: any): string {
    return this.eventsService.currencyFormat(price);
  }

  getRatio(balances: any){
    console.log('balances: ' + JSON.stringify(balances));
    const balancesFormatted = this.balancesService.format(balances);

    const selection = (this.token === 'IO') ? balancesFormatted.IOToken : balancesFormatted.OToken;
    const other     = (this.token === 'IO') ? balancesFormatted.OToken : balancesFormatted.IOToken;

    // (loser / winner) * 100
    return (selection == 0) ? '0.00' :
           ((other * 1.0 / selection) * 100).toFixed(2);
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

  getBalance(stakingBalance): string{
    return stakingBalance.entities[this.optionService.address] !== undefined
      ? this.parseAmount(stakingBalance.entities[this.optionService.address].balance)
      : '0.0';
  }

  parseAmount(amount): string {
    return (isNaN(amount)) ? '0.0' : parseFloat(ethers.utils.formatUnits(amount.toString())).toFixed(2);
  }


}
