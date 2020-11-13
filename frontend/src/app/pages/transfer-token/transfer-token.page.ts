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
import { Position, Side, Token } from '@app/data-model';
import { of } from 'rxjs';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';

@Component({
  selector: 'app-transfer-token',
  templateUrl: './transfer-token.page.html',
  styleUrls: ['./transfer-token.page.scss'],
})
export class TransferTokenPage  extends BaseForm implements OnInit {

  public Position = Position;
  tokenMask = BaseForm.tokenMask;

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  get token() {
    return this.activatedRoute.snapshot.params.token;
  }

  get position() {
    return (this.activatedRoute.snapshot.params.position === '1') ? Position.Left : Position.Right;
  }

  // termsAndConditions = 'https://openpredict.io';
  event$ = this.eventsQuery.selectEntity(this.eventId);
  balance$ = this.balancesQuery.selectEntity(this.eventId);
  availableOptions: any[];

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private optService: OptionService,
    private ui: UiService,
    private eventsService: OpEventService,
    private balancesService: OpBalanceService,
    private eventsQuery: OpEventQuery,
    private balancesQuery: OpBalanceQuery,
    private authQuery: AuthQuery,
    private toastCtrl: ToastController) {
      super();
      this.availableOptions = this.optService.availableOptions;

      this.form = this.fb.group({
        transfer_amount: [null, Validators.compose([Validators.required, Validators.min(0)])],
        transfer_to: [null, Validators.compose(
          [Validators.required, Validators.minLength(42), Validators.maxLength(42), CustomValidators.isAddress])
        ],
      });

      this.balance$.subscribe( balance => {
        console.log('token balances updated:' + JSON.stringify(balance));
        this.form.get('option_stake').setValidators(
            [CustomValidators.numberRange(100, this.getTokenBalance(balance) )]
          );
      });

      this.form.get('transfer_amount').setValidators([CustomValidators.numberRange(0.00000001, Number.MAX_VALUE)]);
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
        filter(id => !this.balancesQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.balancesService.getBalance(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const to = this.form.controls['transfer_to'].value;
    const amount = BaseForm.transformAmount(this.form.controls['transfer_amount'].value);
    const selection = (this.activatedRoute.snapshot.params.token === 'IO' ? 0 : 1);

    try {
     const interaction = await this.ui
                             .loading(  this.eventsService.transferFrom(eventId, to, amount, selection),
                             'please wait...' )
                             .catch( e => alert(`Error with contract call ${JSON.stringify(e)}`) );

     if (interaction) {
      this.showTransferSuccess();
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

  getTokenBalance(balances: any){
    console.log('transfer-token balances: ' + balances);
    const balancesFormatted = this.balancesService.format(balances);
    return this.token === 'IO' ? balancesFormatted.IOToken : balancesFormatted.OToken;
  }

  // replace with live terms and conditons url
  openTnC() {
    // this.ui.openIAB(this.termsAndConditions);
  }

  async showTransferSuccess() {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: 'Success ! Your tokens have been transferred.'
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }


}

