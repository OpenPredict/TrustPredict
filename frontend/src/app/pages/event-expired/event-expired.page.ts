import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController, ToastController } from '@ionic/angular';
import { UiService } from '@app/services/ui-service/ui.service';
import { Position, Side } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';

@Component({
  selector: 'app-event-expired',
  templateUrl: './event-expired.page.html',
  styleUrls: ['./event-expired.page.scss'],
})
export class EventExpiredPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  modalHeader = `Expired Event`;
  modalTxt = `
    <p>
      Events here failed to go live due to having insufficient funding. If you made a stake on
      this event, and you haven't withdrawn it yet, you will be shown a <b>Withdraw Deposit</b> button.
      Click this and follow the instructions to withdraw the original stake you made on this event.
    </p>`;

  event$ = this.eventsQuery.selectEntity(this.eventId);
  hasBalanceInAnyToken$ = this.hasBalanceInAnyToken();

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventService: OpEventService,
    private balancesService: OpBalanceService,
    private eventsQuery: OpEventQuery,
    private authQuery: AuthQuery,
    private toastCtrl: ToastController,
    private ui: UiService) {
      console.log('created');
      this.hasBalanceInAnyToken();
    }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
        map( params => params.get('eventId') ),
        filter(id => !this.eventsQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.eventService.getEvent(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;

    try {
     const interaction = await this.ui
                             .loading(  this.eventService.revoke(eventId),
                             'You will be prompted for 2 contract interactions, please approve both to successfully take part and please be patient as it may take a few moments to broadcast to the network.' )
                             .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );

     if (interaction) {
      this.showRevokeSuccess();
    }
    } catch (error) {
      alert(`Error ! ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  getToken(position: Position, betSide: Side): string {
    return this.eventService.getToken(position, betSide);
  }

  getDate(timestamp: number){
    return this.eventService.timestampToDate(timestamp);
  }

  currencyFormat(price: any): string {
    return this.eventService.currencyFormat(price);
  }

  async showRevokeSuccess() {
    const toast = await this.toastCtrl.create({
      position: 'middle',
      duration: 2000,
      cssClass: 'successToast',
      message: 'Success ! Your deposit has been withdrawn.'
    });
    await toast.present();
    setTimeout( async () => {
      await toast.dismiss();
      this.navCtrl.navigateForward('/my-events');
    }, 2500);
  }

  async hasBalanceInAnyToken() {
    const balancesFormatted = this.balancesService.getById(this.eventId);
    return balancesFormatted.IOToken > 0 || balancesFormatted.OToken > 0;
  }


}
