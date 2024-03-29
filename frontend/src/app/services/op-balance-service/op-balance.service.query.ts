import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { OpBalancesStore, State } from '@services/op-balance-service/op-balance.service.store';
import { ITokenBalance } from '@app/data-model';

@Injectable({ providedIn: 'root' })
export class OpBalanceQuery extends QueryEntity<State, ITokenBalance> {
  constructor(protected store: OpBalancesStore) {
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
