import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {}

  
  openOptions() {
    this.navCtrl.navigateForward('landing')
  }
  
  openEvents() {
    this.navCtrl.navigateForward('my-events')
  }  
  
  
}
