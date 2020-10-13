import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthQuery } from '@services/auth-service/auth.service.query';

@Injectable({
  providedIn: 'root'
})
export class WalletGuard implements CanActivate {

  constructor(
    private authQry: AuthQuery,
    private router: Router ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const option =  this.authQry.getValue()
      if(!option || !option.wallet ) {
        console.log('redirecting to connect wallet ');
        this.router.navigateByUrl('/connect-wallet');
      }
      return true;
  }
}
