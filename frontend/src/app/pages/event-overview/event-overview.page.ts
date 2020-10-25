import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { Position, Side, Status, Token } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';

@Component({
  selector: 'app-event-overview',
  templateUrl: './event-overview.page.html',
  styleUrls: ['./event-overview.page.scss'],
})
export class EventOverviewPage implements OnInit, OnDestroy {

  public Position = Position;
  public Status = Status;
  public Token = Token;

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);
  balances = [];


  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery,
    private authQuery: AuthQuery) {
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

  goBack() {
    this.navCtrl.back();
  }

  getConditionText(position: Position): string {
    return this.eventsService.getConditionText(position);
  }

  getClass(position: Position): string {
    return this.eventsService.getClass(position);
  }

  getTransferClass(position: Position, betSide: Side): string {
    return (this.getTokenBalance(position, betSide) > 0) ? 'status-status' : '';
  }

  getToken(position: Position, betSide: Side): string {
    return this.eventsService.getToken(position, betSide);
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

  getTokenBalance(position: Position, betSide: Side): any{
    console.log('this.balances: ' + this.balances);
    console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    const balance = this.balances[(this.eventsService.getToken(position, betSide)) === 'IO' ? 0 : 1];
    return parseFloat(balance).toFixed(2);
  }

  getRatio(position: Position, betSide: Side){
    console.log('this.balances: ' + this.balances);
    console.log('token selection: ' + this.eventsService.getToken(position, betSide));

    const selection = (this.eventsService.getToken(position, betSide)) === 'IO' ? 0 : 1;
    const other = 1 - selection;

    // (loser / winner) * 100
    return (this.balances[selection] === 0) ? '0.00' :
           ((this.balances[other] * 1.0 / this.balances[selection]) * 100).toFixed(2);
  }

  getDate(timestamp: number){
    return this.eventsService.timestampToDate(timestamp);
  }

  /**
   * Opens the staking page
   * @param token token string
   * @param position if coming from the LHS or RHS
   */
  continue(token: string, position: Position, option: string): void {
    if (option === 'transfer' && this.balances[token === 'IO' ? 0 : 1] == 0){
      return;
    }
    (option === 'stake') ? this.navCtrl.navigateForward(`/event-overview-stake/${this.eventId}/${token}/${position}`) :
    (option === 'transfer') ? this.navCtrl.navigateForward(`/transfer-token/${this.eventId}/${token}/${position}`) : '';
  }

}
