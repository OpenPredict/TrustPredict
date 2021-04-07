import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { OptionService } from '@app/services/option-service/option.service';
import { AppHeaderComponent } from "@components/app-header/app-header.component";

@Component({
  selector: 'app-event-overview',
  templateUrl: './event-overview.page.html',
  styleUrls: ['./event-overview.page.scss'],
})
export class EventOverviewPage implements OnInit, OnDestroy {

  @ViewChild("header") header: AppHeaderComponent;
  public Position = Position;
  public Status = Status;
  public Token = Token;
  yesRation: any;   
  noRation: any;   

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);
  balance$ = this.balancesQuery.selectEntity(this.balancesService.getID(this.eventId));

  modalHeader = 'Event Overview';
  modalTxt = `
    <p>
      On this screen we are shown general information about the event. If you have previously staked on any
      of the outcomes, your balance is shown, and you may select <b>Transfer</b> for that outcome to go to the Transfer Token page.
    </p>
    <p>
      If the event is pending, you will be able to stake on one of the outcomes from here.
    </p>`;

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private optionService: OptionService,
    private eventsQuery: OpEventQuery,
    private balancesService: OpBalanceService,
    private balancesQuery: OpBalanceQuery,
    private authQuery: AuthQuery) {
    console.log('setting subscriber..');
    this.balance$.subscribe(res => {
      console.log('balance updated:' + JSON.stringify(res));
      if (res == undefined) {
        this.balancesService.setBalance(this.balancesService.getID(this.eventId));
        console.log('set empty balances');
      }
    });
    this.event$.subscribe(res => console.log('event updated:' + JSON.stringify(res)));
  }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      map(params => params.get('eventId')),
      filter(id => !this.eventsQuery.hasEntity(id)),
      untilDestroyed(this),
      switchMap(id => this.eventsService.getEvent(id))
    ).subscribe();

    // this.activatedRoute.paramMap.pipe(
    //     map( params => params.get('eventId') ),
    //     filter(id => !this.balancesQuery.hasEntity(id)),
    //     untilDestroyed(this),
    //     switchMap(id => this.balancesService.getBalance(id))
    //   ).subscribe();
  }

  ngOnDestroy() { }

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

  getDate(timestamp: number) {
    return this.eventsService.timestampToDate(timestamp);
  }

  currencyFormat(price: any): string {
    return this.eventsService.currencyFormat(price);
  }

  getTokenBalance(balances: any, position: Position, betSide: Side): any {
    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    const balancesFormatted = this.balancesService.format(balances);
    const balance = (this.eventsService.getToken(position, betSide)) === 'No' ? balancesFormatted.NoToken : balancesFormatted.YesToken;
    return parseFloat(balance.toString()).toFixed(2);
  }

  getRatio(balances: any, position: Position, betSide: Side) {

    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));

    const index = (this.eventsService.getToken(position, betSide)) === 'No' ? 0 : 1;
    const selection = balances[index];
    const other = balances[1 - index];

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
    const selection = (token === 'No') ? balancesFormatted.NoToken : balancesFormatted.YesToken;
    if (option === 'transfer' && selection == 0) {
      return;
    }
    (option === 'stake') ? this.navCtrl.navigateForward(`/event-overview-stake/${this.eventId}/${token}/${position}`) :
      (option === 'transfer') ? this.navCtrl.navigateForward(`/transfer-token/${this.eventId}/${token}/${position}`) : '';
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

  calcRatio(yesVal, noVal) {
    let total = yesVal + noVal;
    this.yesRation = parseFloat(((yesVal / total) * 100).toString()).toFixed(2);
    this.noRation = parseFloat(((noVal / total) * 100).toString()).toFixed(2);
  }

  getSymbol(): string {
    return this.eventsService.getSymbol();
  }
}
