import { Component } from '@angular/core';

import { Config, NavController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { OptionService } from './services/option-service/option.service';
import { CryptoService } from './services/crypto-service/crypto.service';
import { OpEventService } from './services/op-event-service/op-event.service';
import { AuthService } from './services/auth-service/auth.service';

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
    public crypto: CryptoService,
    public navCtrl: NavController,
    public opEvent: OpEventService,
    public _auth: AuthService,
  ) {
    this.initializeApp();
  }
  
  initializeApp() {
    
    this.optionsSrv.get().subscribe();
    
    this.platform.ready().then( async () => {
      
      const signer: any = await this.crypto.getSigner();
      const wallet: any = await this.crypto.signerAddress();

      if (wallet && signer) {
        this._auth.login(wallet, signer);
        this.opEvent.setupEventSubscriber();
        this.navCtrl.navigateForward('/landing');
      }      
      
      
      this.config.set('navAnimation', null);
      this.config.set('animated', false);
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
