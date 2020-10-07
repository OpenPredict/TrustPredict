import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { EventsStore, State } from '@services/op-event-service/op-event.service.store';
import { IEvent } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class OpEventQuery extends QueryEntity<State, IEvent> {
  constructor(protected store: EventsStore) {
    super(store);
  }

  getEvent(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id.includes(term)
    });
  }
}
