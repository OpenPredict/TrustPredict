import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthQuery } from '@services/auth-service/auth.service.query';
import { CryptoService } from './services/crypto-service/crypto.service';
import { OpEventService } from './services/op-event-service/op-event.service';
import { OpBalanceService } from './services/op-balance-service/op-balance.service';
import { StakingBalanceService } from './services/staking-balance-service/staking-balance.service';

@Injectable({
  providedIn: 'root'
})
export class WalletGuard implements CanActivate {

  constructor(
    private authQry: AuthQuery,
    private cryptoService: CryptoService,
    private opEventService: OpEventService,
    private opBalanceService: OpBalanceService,
    private stakingBalanceService: StakingBalanceService,
    private router: Router ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      // attempt to init with first connected wallet, if not, go to 'connect wallet' screen.
      this.cryptoService.setProvider()
      .then(async wallets => {
        //console.log('wallets: ' + JSON.stringify(wallets));
        this.cryptoService.initContracts(wallets['wallet'], wallets['signer']);
        this.opEventService.setupSubscribers().then( () => {
            this.opBalanceService.setupSubscriber().then( () => {
              this.stakingBalanceService.setupSubscriber();
            })
        });
      })
      .catch(error => {
        console.log('redirecting to connect wallet ');
        this.router.navigateByUrl('/connect-wallet');
      });

      return true;
  }
}
