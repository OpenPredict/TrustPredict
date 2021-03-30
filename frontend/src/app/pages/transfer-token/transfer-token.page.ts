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
import { Position, Side, Token } from '@app/data-model';
import { of } from 'rxjs';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';
import { AppHeaderComponent } from "@components/app-header/app-header.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-transfer-token',
  templateUrl: './transfer-token.page.html',
  styleUrls: ['./transfer-token.page.scss'],
})
export class TransferTokenPage extends BaseForm implements OnInit {

  @ViewChild("header") header: AppHeaderComponent;
  modalHeader = 'Transfer Event Tokens';
  modalTxt = `
    <p>
      Transfer event tokens for the chosen outcome to another address. Your balance for this event 
      token is shown above the input box.
    </p>`;

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
  balance$ = this.balancesQuery.selectEntity(this.balancesService.getID(this.eventId));
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
    private toastCtrl: ToastController,
    private toastr: ToastrService) {
    super();
    this.availableOptions = this.optService.availableOptions;

    this.form = this.fb.group({
      transfer_amount: [null, Validators.compose([Validators.required, Validators.min(0)])],
      transfer_to: [null, Validators.compose(
        [Validators.required, Validators.minLength(42), Validators.maxLength(42), CustomValidators.isAddress])
      ],
    });

    this.form.get('transfer_amount').setValidators(
      [CustomValidators.numberRange(0.00000001, Number.MAX_VALUE)]
    );
    this.balance$.subscribe(balance => {
      this.form.get('transfer_amount').setValidators(
        [CustomValidators.numberRange(0.00000001, this.getTokenBalance(balance))]
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
      filter(id => !this.balancesQuery.hasEntity(id)),
      untilDestroyed(this),
      switchMap(id => this.balancesService.getBalance(id))
    ).subscribe();
  }

  ngOnDestroy() { }

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const to = this.form.controls['transfer_to'].value;
    const amount = BaseForm.transformAmount(this.form.controls['transfer_amount'].value);
    const selection = (this.activatedRoute.snapshot.params.token === 'No' ? 0 : 1);

    try {
      const interaction = await this.ui
        .loading(this.eventsService.transferFrom(eventId, to, amount, selection),
          'please wait...')
        .catch(e => alert(`Error with contract call ${JSON.stringify(e)}`));

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

  getDate(timestamp: number) {
    return this.eventsService.timestampToDate(timestamp);
  }

  currencyFormat(price: any): string {
    return this.eventsService.currencyFormat(price);
  }

  getTokenBalance(balances: any) {
    const balancesFormatted = this.balancesService.format(balances);
    return this.token === 'No' ? balancesFormatted.NoToken : balancesFormatted.YesToken;
  }

  // replace with live terms and conditons url
  openTnC() {
    // this.ui.openIAB(this.termsAndConditions);
  }

  async showTransferSuccess() {
    // const toast = await this.toastCtrl.create({
    //   position: 'middle',
    //   duration: 2000,
    //   cssClass: 'successToast',
    //   message: 'You have successfully transferred your tokens.'
    // });
    // await toast.present();
    this.toastr.info('Token transfer successful.');
    setTimeout(async () => {
      //await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }

  information() {
    this.header.information();
  }

}

