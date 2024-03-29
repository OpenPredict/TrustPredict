import { Injectable } from '@angular/core';
import { ITokenBalance } from '@app/data-model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface State extends EntityState<ITokenBalance> {}

const initialState: State = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'balances', resettable: true })
export class OpBalancesStore extends EntityStore<State, ITokenBalance> {
  constructor() {
    super( initialState );
  }
}