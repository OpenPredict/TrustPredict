import { Component, Input, OnInit } from '@angular/core';
import { IEvent, Side } from '@app/data-model';
import { OpEventService } from '@services/op-event-service/op-event.service';
import makeBlockie from 'ethereum-blockies-base64';

@Component({
  selector: 'app-event-item',
  templateUrl: './event-item.component.html',
  styleUrls: ['./event-item.component.scss'],
})
export class EventItemComponent implements OnInit {

  @Input() event: IEvent;

  constructor(private eventService: OpEventService ) { }

  ngOnInit() {}

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  getStatusText(event: any): string {
    return this.eventService.getStatusText(event);
  }

  getTotalValue(value: any): string {
    return this.eventService.getTotalValue(value);
  }

  createEventIdImage(event: any){
    const img = new Image() ;
    img.src = makeBlockie(event.id);
    // img.src needs to be inserted into the page
  }

}


