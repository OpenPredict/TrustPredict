import { Component } from '@angular/core';

import { Config, NavController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { OptionService } from './services/option-service/option.service';
import { CryptoService } from './services/crypto-service/crypto.service';
import { OpEventService } from './services/op-event-service/op-event.service';
import { AuthService } from './services/auth-service/auth.service';
import { OpEventQuery } from './services/op-event-service/op-event.service.query';
import { OpBalanceService } from './services/op-balance-service/op-balance.service';
import { StakingBalanceService } from './services/staking-balance-service/staking-balance.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private config: Config,
    private statusBar: StatusBar,
    public optionsSrv: OptionService,
    public cryptoService: CryptoService,
    public navCtrl: NavController,
    public opEventService: OpEventService,
    public opBalanceService: OpBalanceService,
    public stakingBalanceService: StakingBalanceService,
    public opEventQuery: OpEventQuery,
    public _auth: AuthService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.optionsSrv.get().subscribe();

    this.platform.ready().then( async () => {
      await this.cryptoService.onNetworkChange()
      this.config.set('navAnimation', null);
      this.config.set('animated', false);
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

}
