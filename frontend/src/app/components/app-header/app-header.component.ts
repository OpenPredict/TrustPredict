import { ChangeDetectorRef, Component, NgZone, OnInit, SimpleChanges } from '@angular/core';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ModalController, NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { InformationModalComponent } from "@components/information-modal/information-modal.component";
import { WalletOptionsModalComponent } from '@components/wallet-options-modal/wallet-options-modal.component';

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet );
  address: string;

  constructor(
    private navCtrl: NavController,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    public modalCtrl: ModalController,
    public authQuery: AuthQuery  ) { }

    ngOnInit() {
      this.authQuery.select( user => user.wallet ).subscribe( res => {
        this.zone.run(() => {
          this.address = res;
          this.cd.detectChanges();
        });
      });
    }

  openOptions() {
    this.navCtrl.navigateForward('landing');
  }
  
  openEvents() {
    this.navCtrl.navigateForward('my-events');
  }
  
  openEventsFinished() {
    this.navCtrl.navigateForward('event-completed');
  }
  
  async information() {
    try {
      const modalOpts = {
        component: InformationModalComponent,
        componentProps: {
        },
        cssClass: 'opt-modal',
      };
      const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
      const selection = await modal.onDidDismiss();
      if ( selection.data ) {
        console.log(selection.data);
      }
    } catch (error) {
       console.log(`modal present error ${error}`);
       throw error;
    }
  }  
  
  

  async options() {
    try {
      const modalOpts = {
        component: WalletOptionsModalComponent,
        componentProps: {
        },
        cssClass: 'deposit-modal',
      };
      const modal: HTMLIonModalElement = await this.modalCtrl.create(modalOpts);
      await modal.present();
      const selection = await modal.onDidDismiss();
      if ( selection.data ) {
        console.log(selection.data);
      }
    } catch (error) {
       console.log(`modal present error ${error}`);
       throw error;
    }
  }

}
