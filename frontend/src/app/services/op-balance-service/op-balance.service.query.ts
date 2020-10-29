import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BalancesStore, State } from '@services/op-balance-service/op-balance.service.store';
import { IBalance } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class OpBalanceQuery extends QueryEntity<State, IBalance> {
  constructor(protected store: BalancesStore) {
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
