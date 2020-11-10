import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { StakingBalancesStore, State } from '@services/staking-balance-service/staking-balance.service.store';
import { IStakingBalance } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class StakingBalanceQuery extends QueryEntity<State, IStakingBalance> {
  constructor(protected store: StakingBalancesStore) {
    super(store);
  }

  clearState() {
    this.store.remove();
  }

  getBalance(term: string) {
    return this.selectAll({
      filterBy: entity => entity.id == term
    });
  }
}
