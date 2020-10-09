import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AuthState, AuthStore } from './auth.service.store';

@Injectable({ providedIn: 'root' })
export class AuthQuery extends Query<AuthState> {
  isLoggedIn$ = this.select(state => !!state.wallet);
  isLoggedIn2$ = this.select('wallet');

  isLoggedIn() {
    return !!this.getValue().wallet;
  }

  constructor(protected store: AuthStore) {
    super(store);
  }
}