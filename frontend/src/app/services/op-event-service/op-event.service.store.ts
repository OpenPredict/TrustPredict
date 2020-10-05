import { Injectable } from '@angular/core';
import { IEvent } from '@app/data-model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface State extends EntityState<IEvent> {}

const initialState: State = {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'events', resettable: true })
export class EventsStore extends EntityStore<State, IEvent> {
  constructor() {
    super( initialState );
  }
}