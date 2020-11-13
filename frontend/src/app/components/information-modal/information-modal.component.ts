import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-information-modal',
  templateUrl: './information-modal.component.html',
  styleUrls: ['./information-modal.component.scss'],
})
export class InformationModalComponent implements OnInit {

  @Input() modal_header: any;
  @Input() modal_txt: any    

  constructor( 
    public modalCtrl: ModalController,) {}

  ngOnInit() {
    console.log( "X header "+this.modal_header )
    console.log( "X txt "+this.modal_txt )
  }

  async cancel() {
    await this.modalCtrl.dismiss();
  }

}
