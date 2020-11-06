import { Component, OnInit } from '@angular/core';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ModalController, NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { InformationModalComponent } from "@components/information-modal/information-modal.component";

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet )

  constructor(
    private navCtrl: NavController,
    public authQuery: AuthQuery,
    private modalCtrl: ModalController ) { }
    
  openOptions() {
    this.navCtrl.navigateForward('landing');
  }
  
  openEvents() {
    this.navCtrl.navigateForward('my-events');
  }
  
  openEventsFinished() {
    this.navCtrl.navigateForward('event-completed');
  }
  
  async options() {
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
  
  

}
