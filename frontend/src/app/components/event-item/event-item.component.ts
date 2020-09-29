import { Component, Input, OnInit } from '@angular/core';
import { IEvent } from '@app/data-model';
import { OpEventService } from "@services/op-event-service/op-event.service";

@Component({
  selector: 'app-event-item',
  templateUrl: './event-item.component.html',
  styleUrls: ['./event-item.component.scss'],
})
export class EventItemComponent implements OnInit {

  @Input() event: IEvent  
  
  constructor(private eventService: OpEventService ) { }

  ngOnInit() {}

  getClass(condition: boolean): string {
    return this.eventService.getClass(condition)
  }
  
  getConditionText(condition: boolean): string {
    return this.eventService.getConditionText(condition)
  }    
  
}


