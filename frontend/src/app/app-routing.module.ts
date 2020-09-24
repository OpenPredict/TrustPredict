import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuardGuard } from "./auth-guard.guard";
import { WalletGuard } from "./wallet.guard";


const routes: Routes = [
  {
    path: '',
    redirectTo: 'connect-wallet',
    pathMatch: 'full'
  },
  {
    path: 'connect-wallet',
    loadChildren: () => import('./pages/connect-wallet/connect-wallet.module').then( m => m.ConnectWalletPageModule)
  },      
  {
    path: 'landing',      
    canActivate : [WalletGuard],            
    loadChildren: () => import('./pages/landing/landing.module').then( m => m.LandingPageModule)
  },
  {
    path: 'select-token',
    canActivate : [AuthGuardGuard],         
    loadChildren: () => import('./pages/select-token/select-token.module').then( m => m.SelectTokenPageModule)
  },
  {
    path: 'event-condition',
    canActivate : [AuthGuardGuard],         
    loadChildren: () => import('./pages/event-condition/event-condition.module').then( m => m.EventConditionPageModule)
  },
  {
    path: 'event-expiration',
    canActivate : [AuthGuardGuard],         
    loadChildren: () => import('./pages/event-expiration/event-expiration.module').then( m => m.EventExpirationPageModule)
  },
  {
    path: 'launch-option',
    canActivate : [AuthGuardGuard],         
    loadChildren: () => import('./pages/launch-option/launch-option.module').then( m => m.LaunchOptionPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
