import { Injectable } from '@angular/core';
import { IOptionsPriceWager } from '@app/data-model';
import { EntityState, EntityStore, MultiActiveState, StoreConfig } from '@datorama/akita';


export interface State extends EntityState<IOptionsPriceWager> {}

const initialState: State = {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'options', resettable: true })
export class OptionsStore extends EntityStore<State, IOptionsPriceWager> {
  constructor() {
    super( initialState );
  }
}