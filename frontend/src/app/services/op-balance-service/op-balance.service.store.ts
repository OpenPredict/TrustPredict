import { Injectable } from '@angular/core';
import { IBalance } from '@app/data-model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface State extends EntityState<IBalance> {}

const initialState: State = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'balances', resettable: true })
export class BalancesStore extends EntityStore<State, IBalance> {
  constructor() {
    super( initialState );
  }
}