import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EventFactoryStore, EventsStore, EventState, EventFactoryState } from '@services/op-event-service/op-event.service.store';
import { IEvent, IEventFactory } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class OpEventQuery extends QueryEntity<EventState, IEvent> {
  constructor(protected store: EventsStore) {
    super(store);
  }

  clearState() {
    this.store.remove();
  }

  getEvent(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id == term
    });
  }
}

@Injectable({ providedIn: 'root' })
export class OpEventFactoryQuery extends QueryEntity<EventFactoryState, IEventFactory> {
  constructor(protected store: EventFactoryStore) {
    super(store);
  }

  clearState() {
    this.store.remove();
  }

  getEvent(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id == term
    });
  }
}
