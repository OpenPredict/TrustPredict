import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController, ToastController } from '@ionic/angular';
import { UiService } from '@app/services/ui-service/ui.service';
import { Side, Token } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';
import { AppHeaderComponent } from "@components/app-header/app-header.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-event-settled',
  templateUrl: './event-settled.page.html',
  styleUrls: ['./event-settled.page.scss'],
})
export class EventSettledPage implements OnInit {

  @ViewChild("header") header: AppHeaderComponent;
  modalHeader = 'Settled Event';
  modalTxt = `
    <p>
      Events here are complete and have settled on an outcome. If you staked on the winning outcome
      for this event, and you haven't withdrawn it yet, you will be shown a <b>Withdraw Rewards</b> button.
      Click this and follow the instructions to withdraw your original stake, plus any reward due for this event.
    </p>`;

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);
  balance$ = this.balancesQuery.selectEntity(this.balancesService.getID(this.eventId));


  hasBalanceInWinningToken$ = this.hasBalanceInWinningToken();

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private balancesService: OpBalanceService,
    private eventsQuery: OpEventQuery,
    private balancesQuery: OpBalanceQuery,
    private authQuery: AuthQuery,
    public toastCtrl: ToastController,
    private ui: UiService,
    private toastr: ToastrService) {
    console.log('created');
    this.balance$.subscribe(balance => {
      console.log('balance updated:' + JSON.stringify(balance));
      if (balance == undefined) {
        this.balancesService.setBalance(this.balancesService.getID(this.eventId));
        console.log('set empty balances');
      }
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

    try {
      const interaction = await this.ui
        .loading(this.eventsService.claim(eventId),
          'You will be prompted for a contract interaction, please be patient as it may take a few moments to broadcast to the network.')
        .catch(e => alert(`Error with contract interactions ${JSON.stringify(e)}`));

      if (interaction) {
        this.showClaimSuccess();
      }
    } catch (error) {
      alert(`Error ! ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  goTransfer(winner: Token, betSide: Side) {
    /*
      essentially: is the winning token the same as what's being rendered for event data using betSide.
      if No token wins then send the inverse for position
      if Yes token wins then send the same value.
    */
    const position = (winner === Token.No) ? 1 - betSide : betSide;
    const winnerString = (winner === Token.No) ? 'No' : 'Yes';
    this.navCtrl.navigateForward(`/transfer-token/${this.eventId}/${winnerString}/${position}`);
  }

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  getWinningTokenText(winner: Token): string {
    return (winner === Token.Yes) ? 'Yes' : 'No';
  }

  getDate(timestamp: number) {
    return this.eventsService.timestampToDate(timestamp);
  }

  currencyFormat(price: any): string {
    return this.eventsService.currencyFormat(price);
  }

  async hasBalanceInWinningToken() {
    const balancesFormatted = this.balancesService.getById(this.balancesService.getID(this.eventId));
    console.log('balancesFormatted: ' + balancesFormatted);
    const winner = (this.eventsService.events[this.eventId].winner === 0) ? balancesFormatted.NoToken : balancesFormatted.YesToken;
    return winner > 0;
  }

  getTokenBalance(balances: any) {
    const balancesFormatted = this.balancesService.format(balances);
    console.log('balancesFormatted: ' + balancesFormatted);
    const winner = (this.eventsService.events[this.eventId].winner === 0) ? balancesFormatted.NoToken : balancesFormatted.YesToken;
    return winner;
  }

  async showClaimSuccess() {
    // const toast = await this.toastCtrl.create({
    //   position: 'middle',
    //   duration: 2000,
    //   cssClass: 'successToast',
    //   message: 'You have successfully claimed your winnings.'
    // });
    // await toast.present();
    this.toastr.info("Claim successful.");
    setTimeout(async () => {
      //await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }

  information() {
    this.header.information();
  }

  manageTransferBtn(balance) {
    const balancesFormatted = this.balancesService.format(balance);
    if(balancesFormatted.NoToken > 0 || balancesFormatted.YesToken > 0){
      return true;
    } else {
      return false;
    }
  }
}
