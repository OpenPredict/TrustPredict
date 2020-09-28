import { Component, Input, OnInit } from '@angular/core';
import { IEvent } from '@app/data-model';

@Component({
  selector: 'app-event-item',
  templateUrl: './event-item.component.html',
  styleUrls: ['./event-item.component.scss'],
})
export class EventItemComponent implements OnInit {

  @Input() event: IEvent  
  
  constructor() { }

  ngOnInit() {}

  getClass(condition: boolean) {
    return (!condition) ? "status-red" : "status-green"
  }
  
}


