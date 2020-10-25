import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController, ToastController } from '@ionic/angular';
import { UiService } from '@app/services/ui-service/ui.service';
import { Side, Token } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ethers } from 'ethers';

@Component({
  selector: 'app-event-settled',
  templateUrl: './event-settled.page.html',
  styleUrls: ['./event-settled.page.scss'],
})
export class EventSettledPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);
  balances = [];
  hasBalanceInWinningToken$ = this.hasBalanceInWinningToken();

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery,
    private authQuery: AuthQuery,
    public toastCtrl: ToastController,
    private ui: UiService) {
      console.log('created');
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

    try {
      const interaction = await this.ui
                             .loading(  this.eventsService.claim(eventId),
                             'You will be prompted for 1 contract interaction, please approve it and be patient as it may take a few moments to broadcast to the network.' )
                             .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );

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
      if IO token wins then no; send the inverse for position
      if O token wins then yes. send the same value.
    */
    const position = (winner === Token.IO) ? 1 - betSide : betSide;
    const winnerString = (winner === Token.IO) ? 'IO' : 'O';
    this.navCtrl.navigateForward(`/transfer-token/${this.eventId}/${winnerString}/${position}`);
  }

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  getWinningTokenText(winner: Token): string {
    return (winner === Token.O) ? 'O' : 'IO';
  }

  getDate(timestamp: number){
    return this.eventsService.timestampToDate(timestamp);
  }

  async hasBalanceInWinningToken() {
    const _USER: any  = this.authQuery.getValue();
    const signer: any = _USER.signer;

    const eventId = this.activatedRoute.snapshot.params.eventId;

    console.log('eventId: ' + eventId);
    console.log('winner: ' + this.eventsService.events[eventId].winner);


    const address = await signer.getAddress();
    console.log('address: ' + address);
    this.balances = await this.eventsService.balanceOfAddress(this.eventId, address);
    console.log('balances: ' + this.balances);

    return this.balances[this.eventsService.events[eventId].winner] > 0;
  }

  getTokenBalance(){
    return this.balances[this.eventsService.events[this.eventId].winner];
  }

  async showClaimSuccess() {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: 'Success ! Your winnings have been claimed.'
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }
}
