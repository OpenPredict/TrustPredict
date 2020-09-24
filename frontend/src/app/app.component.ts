import { Component } from '@angular/core';

import { Config, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { OptionService } from './services/option-service/option.service';

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
  ) {
    this.initializeApp();
  }
  
  initializeApp() {
    
    this.optionsSrv.get().subscribe();
    
    this.platform.ready().then(() => {
      // if(this.platform.is("desktop")) {
        this.config.set('navAnimation', null);
        this.config.set('animated', false);
      // }        
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
