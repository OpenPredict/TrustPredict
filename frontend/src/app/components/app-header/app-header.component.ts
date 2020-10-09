import { Component, OnInit } from '@angular/core';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {

  loggedIn$: Observable<boolean> = this.authQuery.select( user => !!user.wallet )

  constructor(
    private navCtrl: NavController,
    public authQuery: AuthQuery ) { }
  openOptions() {
    this.navCtrl.navigateForward('landing');
  }
  openEvents() {
    this.navCtrl.navigateForward('my-events');
  }
  openEventsFinished() {
    this.navCtrl.navigateForward('event-completed');
  }

}
