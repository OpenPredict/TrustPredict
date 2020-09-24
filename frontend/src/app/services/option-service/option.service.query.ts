import { Injectable } from '@angular/core';
import { Query, QueryConfig, QueryEntity } from '@datorama/akita';
import { OptionsStore, State } from './option.service.store';
import { IOptionsPriceWager } from '@app/data-model';

@Injectable({ providedIn: 'root' })
// @QueryConfig({ sortBy: 'price' })
export class OptionQuery extends QueryEntity<State, IOptionsPriceWager> {
  constructor(protected store: OptionsStore) {
    super(store);
  }  
}