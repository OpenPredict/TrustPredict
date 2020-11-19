
import { Injectable } from '@angular/core';
import { AuthStore } from './auth.service.store';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private router: Router,
    private authStore: AuthStore ) {}

  async login(authenticationData: any) {
    const { wallet, signer, chainId, chainName, provider } = authenticationData  
    this.authStore.update({ wallet, signer, chainId, chainName, provider })
  }

  logout() {
    this.authStore.reset();
    this.router.navigateByUrl("/")
  }  

}