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

@Component({
  selector: 'app-event-expired',
  templateUrl: './event-expired.page.html',
  styleUrls: ['./event-expired.page.scss'],
})
export class EventExpiredPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);
  hasBalanceInAnyToken$ = this.hasBalanceInAnyToken();

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
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
        switchMap(id => this.eventsService.getEvent(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;

    try {
     const interaction = await this.ui
                             .loading(  this.eventsService.revoke(eventId),
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
    return this.eventsService.getToken(position, betSide);
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
    const _USER: any  = this.authQuery.getValue();
    const signer: any = _USER.signer;

    const eventId = this.activatedRoute.snapshot.params.eventId;
    const address = await signer.getAddress();
    console.log('address: ' + address);
    const balances = await this.eventsService.balanceOfAddress(this.eventId, address);
    console.log('balances: ' + balances);

    return balances[0] > 0 || balances[1] > 0;
  }
}
