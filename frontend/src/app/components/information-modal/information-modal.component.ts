import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-information-modal',
  templateUrl: './information-modal.component.html',
  styleUrls: ['./information-modal.component.scss'],
})
export class InformationModalComponent implements OnInit {

  constructor( public modalCtrl: ModalController,) { }

  ngOnInit() {
  }

  async cancel() {
    await this.modalCtrl.dismiss();
  }

}
