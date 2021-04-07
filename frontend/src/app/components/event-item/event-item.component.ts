import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { IEvent, Side, Status } from '@app/data-model';
import { OpEventService } from '@services/op-event-service/op-event.service';
import makeBlockie from 'ethereum-blockies-base64';


@Component({
  selector: 'app-event-item',
  templateUrl: './event-item.component.html',
  styleUrls: ['./event-item.component.scss'],
})
export class EventItemComponent implements OnInit {

  @Input() event: IEvent;
  timeLeft: number;
  timeToShow: any;
  interval;
  constructor(private eventService: OpEventService ) { }

  ngOnInit() {
    if(this.event.deposit_period_end !== undefined){
      this.initializeTime(this.event.deposit_period_end)
    }
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  initializeTime(endtime) {
    this.timeLeft = endtime - (new Date().getTime() / 1000);
    this.interval = setInterval(() => {
      if(this.timeLeft > 0) {
        this.timeLeft--;
        const secondsInThisHour = this.timeLeft % 3600;
        const hours   = Math.floor(this.timeLeft / 3600);
        const minutes = Math.floor(secondsInThisHour / 60);
        const seconds = Math.floor(secondsInThisHour % 60);
        this.timeToShow = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      } else {
        clearInterval(this.interval);
      }
    },1000)
  }

  getRatio(balances: any, betSide: Side) {
    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    const selection = balances[betSide];
    const other = balances[1 - betSide];

    // (loser / winner) * 100
    return (selection === 0) ? '0.00' :
      ((other * 1.0 / selection) * 100).toFixed(2);
  }

  showMinimumText(balances: any, status: Status) {
    // console.log('balances: ' + JSON.stringify(balances));
    // console.log('token selection: ' + this.eventsService.getToken(position, betSide));
    return status == Status.Staking && (balances[0] + balances[1]) >= 1000;
  }

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  currencyFormat(price: any): string {
    return this.eventService.currencyFormat(price);
  }

  getStatusText(event: any): string {
    return this.eventService.getStatusText(event);
  }

  getTotalValue(value: any): string {
    return this.eventService.getTotalValue(value);
  }

  makeBlockie(id): string {
    return makeBlockie(id);
  }

}


