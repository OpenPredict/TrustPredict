import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-wallet-options-modal',
  templateUrl: './wallet-options-modal.component.html',
  styleUrls: ['./wallet-options-modal.component.scss'],
})
export class WalletOptionsModalComponent implements OnInit {

  // wallet$: Observable<string> = this.authQuery.select( user => user.wallet )
  wallet: any;

  constructor(
    public modalCtrl: ModalController,
    public authService: AuthService,
    public authQuery: AuthQuery,
    private router: Router ) { }

  ngOnInit() {
    this.wallet = this.authQuery.getValue();
  }

  async openEtherscan(wallet: string) {
    window.open(`https://etherscan.io/address/${wallet}`, '_blank');
    await this.modalCtrl.dismiss();
  }

  async logout(wallet: string) {
    this.authService.logout();
    await this.modalCtrl.dismiss();
    this.router.navigateByUrl('/connect-wallet');
  }


  async cancel() {
    await this.modalCtrl.dismiss();
  }

}
