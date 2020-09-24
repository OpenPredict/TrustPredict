import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardGuard implements CanActivate {
  
  constructor(
  private optQry: OptionQuery,
  private router: Router ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
          const option =  this.optQry.getEntity(1)
          console.log(option)
          if(!option || !option.pair || !option.pair_contract) {
             this.router.navigateByUrl("/landing")
          }
        return true;
  }
 
}
