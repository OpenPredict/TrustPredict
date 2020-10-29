import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { Position, Side, Status, Token } from '@app/data-model';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceQuery } from '@app/services/op-balance-service/op-balance.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';

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
  balance$ = this.balancesQuery.selectEntity(this.eventId);

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery,
    private balancesService: OpBalanceService,
    private balancesQuery: OpBalanceQuery,
    private authQuery: AuthQuery) {
      console.log('setting subscriber..');
      this.balance$.subscribe( res => console.log('balance updated:' + JSON.stringify(res)) );
      this.event$.subscribe( res => console.log('event updated:' + JSON.stringify(res)) );
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

  goBack() {
    this.navCtrl.back();
  }

  getConditionText(position: Position): string {
    return this.eventsService.getConditionText(position);
  }

  getClass(position: Position): string {
    return this.eventsService.getClass(position);
  }

  getTransferClass(balances: any, position: Position, betSide: Side): string {
    return (this.getTokenBalance(balances, position, betSide) > 0) ? 'status-status' : '';
  }

  getToken(position: Position, betSide: Side): string {
    return this.eventsService.getToken(position, betSide);
  }

  getDate(timestamp: number){
    return this.eventsService.timestampToDate(timestamp);
  }

  getTokenBalance(balances: any, position: Position, betSide: Side): any{
    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    const balancesFormatted = this.balancesService.format(balances);
    const balance = (this.eventsService.getToken(position, betSide)) === 'IO' ? balancesFormatted.IOToken : balancesFormatted.OToken;
    return parseFloat(balance.toString()).toFixed(2);
  }

  getRatio(balances: any, position: Position, betSide: Side){
    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    const balancesFormatted = this.balancesService.format(balances);

    const selection = (this.eventsService.getToken(position, betSide)) === 'IO' ? balancesFormatted.IOToken : balancesFormatted.OToken;
    const other = (this.eventsService.getToken(position, betSide)) === 'IO' ? balancesFormatted.OToken : balancesFormatted.IOToken;

    // (loser / winner) * 100
    return (selection === 0) ? '0.00' :
           ((other * 1.0 / selection) * 100).toFixed(2);
  }



  /**
   * Opens the staking page
   * @param token token string
   * @param position if coming from the LHS or RHS
   */
  continue(balances: any, token: string, position: Position, option: string): void {
    const balancesFormatted = this.balancesService.format(balances);
    const selection = (token === 'IO') ? balancesFormatted.IOToken : balancesFormatted.OToken;
    if (option === 'transfer' && selection == 0){
      return;
    }
    (option === 'stake') ? this.navCtrl.navigateForward(`/event-overview-stake/${this.eventId}/${token}/${position}`) :
    (option === 'transfer') ? this.navCtrl.navigateForward(`/transfer-token/${this.eventId}/${token}/${position}`) : '';
  }

}
