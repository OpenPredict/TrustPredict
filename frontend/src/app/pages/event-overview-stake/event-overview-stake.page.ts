import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { AppHeaderComponent } from "@components/app-header/app-header.component";

@Component({
  selector: 'app-event-overview-stake',
  templateUrl: './event-overview-stake.page.html',
  styleUrls: ['./event-overview-stake.page.scss'],
})
export class EventOverviewStakePage extends BaseForm implements OnInit {

  @ViewChild("header") header: AppHeaderComponent;
  Position = Position;
  dollarMask = BaseForm.dollarMask;

  modalHeader = 'Stake on an Event';
  modalTxt = `
    <p>
      Having selected an outcome, this screen allows you to place a wager on it.
    </p>
    <p>
      The <b>win ratio</b> tells you the winning amount you get per token staked; ie. if you place a $100
      wager on an event with 150% win ratio, and your chosen outcome wins, you will win $50: $100 (your
      original stake) plus winnings of $50.
    <p>
      The max amount you can stake and your staking balance is also shown. You must agree to the terms and conditions to continue.
    </p>`;

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
  opBalance$ = this.opBalancesQuery.selectEntity(this.balancesService.getID(this.eventId));

  stakingBalance$ = this.stakingBalanceQuery.select();
  availableOptions: any[];

  lastStakingBalance = -1;
  lastOpBalance = -1;

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
      agreedTerms: [false, Validators.requiredTrue],
    });

    // TODO add this back in when I figure out multi-subscribers
    this.stakingBalance$.subscribe(stakingBalance => {
      console.log('stakingBalance updated:' + JSON.stringify(stakingBalance));
      console.log(this.getBalance(stakingBalance));
      const nextStakingBalance = parseFloat(this.getBalance(stakingBalance));
      this.lastStakingBalance = nextStakingBalance;
      // return the lower of the two, assuming OpBalance has been set.
      const maximum = (nextStakingBalance > this.lastOpBalance && this.lastOpBalance >= 0) ? this.lastOpBalance : nextStakingBalance;

      this.form.get('option_stake').setValidators(
        [CustomValidators.numberRange(0.01, maximum)]
      );
    });

    this.opBalance$.subscribe(opBalance => {
      console.log('opBalance updated:' + JSON.stringify(opBalance));
      if (opBalance == undefined) {
        this.balancesService.setBalance(this.balancesService.getID(this.eventId));
        console.log('set empty opBalance');
        return;
      }

      const nextOpBalance = this.getMaxStake(opBalance);
      this.lastOpBalance = nextOpBalance;
      // return the lower of the two, assuming StakingBalance has been set.
      const maximum = (nextOpBalance > this.lastStakingBalance && this.lastStakingBalance >= 0) ? nextOpBalance : nextOpBalance;

      this.form.get('option_stake').setValidators(
        [CustomValidators.numberRange(0.01, maximum)]
      );
    });
  }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      map(params => params.get('eventId')),
      filter(id => !this.eventsQuery.hasEntity(id)),
      untilDestroyed(this),
      switchMap(id => this.eventsService.getEvent(id))
    ).subscribe();

    this.activatedRoute.paramMap.pipe(
      map(params => params.get('eventId')),
      filter(id => !this.opBalancesQuery.hasEntity(id)),
      untilDestroyed(this),
      switchMap(id => this.balancesService.getBalance(id))
    ).subscribe();
  }

  ngOnDestroy() { }

  async continue() {
    console.log('in continue');
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const numTokensStakedToMint = BaseForm.transformAmount(this.form.controls['option_stake'].value);
    const selection = (this.token === 'No') ? 0 : 1;

    try {
      const interaction = await this.ui
        .loading(this.eventsService.stake(eventId, numTokensStakedToMint, selection),
          'You will be prompted for 2 contract interactions, please approve both to successfully take part and please be patient as it may take a few moments to broadcast to the network.')
        .catch(e => alert(`Error with contract interactions ${JSON.stringify(e)}`));

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

  getDate(timestamp: number) {
    return this.eventsService.timestampToDate(timestamp);
  }

  currencyFormat(price: any): string {
    return this.eventsService.currencyFormat(price);
  }

  getMaxStake(balances: any): number {

    const balancesFormatted = this.balancesService.format(balances);
    const minTokens = 10;
    const factor = 2;
    const total = (balancesFormatted.YesToken + balancesFormatted.NoToken);
    const minTokensMaxStake = minTokens / factor;
    const totalMaxStake = total / factor;

    const selection = (this.token === 'Yes') ? balancesFormatted.YesToken : balancesFormatted.NoToken;
    const other = (this.token === 'Yes') ? balancesFormatted.NoToken : balancesFormatted.YesToken;

    let result = 0;
    if (total < minTokens) {
      let maxDifference = minTokens - selection - (minTokens / 10);
      if (maxDifference < 0) { maxDifference = 0; }
      result = (minTokensMaxStake < maxDifference) ? minTokensMaxStake : maxDifference;
    } else {
      let maxStake = (9 * other) - selection;
      if (maxStake < 0) { maxStake = 0; }
      result = (maxStake > totalMaxStake) ? totalMaxStake : maxStake;
    }

    return Number(parseFloat((result * 100).toString()).toFixed(2)); // 100 OPUSD == 1 token
  }



  getRatio(balances: any) {
    //console.log('balances: ' + JSON.stringify(balances));
    const balancesFormatted = this.balancesService.format(balances);

    const selection = (this.token === 'No') ? balancesFormatted.NoToken : balancesFormatted.YesToken;
    const other = (this.token === 'No') ? balancesFormatted.YesToken : balancesFormatted.NoToken;

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
      message: 'You have successfully placed your stake.'
    });
    await toast.present();
    setTimeout(async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }

  getBalance(stakingBalance): string {
    return stakingBalance.entities[this.optionService.address] !== undefined
      ? this.parseAmount(stakingBalance.entities[this.optionService.address].balance)
      : '0.0';
  }

  parseAmount(amount): string {
    return (isNaN(amount)) ? '0.0' : parseFloat(ethers.utils.formatUnits(amount.toString())).toFixed(2);
  }

  information() {
    this.header.information();
  }

}
