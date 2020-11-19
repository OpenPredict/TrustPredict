  
import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
export interface AuthState {
  wallet: string;
  signer: any;
  chainId: any;
  chainName: any;  
  provider: any;
}

export function createInitialState(): AuthState {
  return {
    wallet: null,
    signer: null,
    chainId: null,
    chainName: null, 
    provider: null,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth', resettable: true })
export class AuthStore extends Store<AuthState> {
  constructor() {
    super(createInitialState());
  }
}
