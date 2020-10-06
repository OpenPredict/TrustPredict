import { Component, Inject, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { LedgerWallet } from '@app/data-model';
// import { ethers } from 'ethers';

// import { WEB3 } from "../../web3";
// import Web3 from 'web3';
import { AuthService } from '@app/services/auth-service/auth.service';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { AuthQuery } from '@app/services/auth-service/auth.service.query';

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.page.html',
  styleUrls: ['./connect-wallet.page.scss'],
})
export class ConnectWalletPage implements OnInit {

  constructor(
    // @Inject(WEB3) private web3: Web3,
    private fb: FormBuilder,
    public opEvent: OpEventService,
    public _auth: AuthService,
    public _authQ: AuthQuery,
    private crypto: CryptoService,
    public navCtrl: NavController ) {
    }

    ngOnInit() {

    }

  /**
   * Get signer address from metamask
   */
  // async openMetamask() {
  //   try {
  //     const signer: string[] = await this.crypto.metamaskDefaultSigner()
  //     if(signer && signer.length) {
  //       console.log(signer)
  //       this._auth.login(signer[0])
  //       this.navCtrl.navigateForward('/landing')
  //       return signer
  //     }
  //   } catch (error) {
  //     alert(error)
  //   }
  // }


  async openMetamask() {
    try {
      const signer: any = await this.crypto.getSigner();
      const wallet: any = await this.crypto.signerAddress();

      if (wallet && signer) {
        this._auth.login(wallet, signer);
        this.opEvent.setupEventSubscriber();
        this.navCtrl.navigateForward('/landing');
      }
    } catch (error) {
      alert(error);
    }
  }

  /**
   * Get signer address from ledgher HW wallet connected via USB
   */
  // async openLedger() {
  //   try {
  //     const signer: LedgerWallet  = await this.crypto.ledgerDefaultSigner()
  //     if(signer && signer.address) {
  //       console.log(signer)
  //     }
  //   } catch (error) {
  //     // incorrect length means the user needs to open the ethereum app on the ledger
  //     // unable to claim interface usually means this app is open in more than one browser window and the other window is using the interfeace
  //     alert(error)
  //   }
  // }
}
