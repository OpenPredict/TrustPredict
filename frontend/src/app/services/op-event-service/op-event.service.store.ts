import { Injectable } from '@angular/core';
import { IEvent, IEventFactory } from '@app/data-model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface EventState extends EntityState<IEvent> {}
const initialEventState: EventState = {};

export interface EventFactoryState extends EntityState<IEventFactory> {}
const initialEventFactoryState: EventFactoryState = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'events', resettable: true })
export class EventsStore extends EntityStore<EventState, IEvent> {
  constructor() {
    super( initialEventState );
  }
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'eventFactory', resettable: true })
export class EventFactoryStore extends EntityStore<EventFactoryState, IEventFactory> {
  constructor() {
    super( initialEventFactoryState );
  }
}