
import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { AuthState, AuthStore } from './auth.service.store';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private authStore: AuthStore ) {}

  login(wallet: string, signer: any) {
    this.authStore.update({ wallet,  signer })
  }

  logout() {
    this.authStore.reset();
  }
}