import { Injectable } from '@angular/core';
import { IStakingBalance } from '@app/data-model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface State extends EntityState<IStakingBalance> {}

const initialState: State = {};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'balances', resettable: true })
export class StakingBalancesStore extends EntityStore<State, IStakingBalance> {
  constructor() {
    super( initialState );
  }
}