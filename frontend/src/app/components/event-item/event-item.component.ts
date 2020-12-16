import { Component, Input, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { IEvent, Side } from '@app/data-model';
import { OpEventService } from '@services/op-event-service/op-event.service';


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
    this.timeLeft = endtime;
    this.interval = setInterval(() => {
      if(this.timeLeft > 0) {
        this.timeLeft--;
        this.timeToShow = new Date(this.timeLeft * 1000).toISOString().substr(11, 8);
      } else {
        clearInterval(this.interval);
      }
    },1000)
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

}


