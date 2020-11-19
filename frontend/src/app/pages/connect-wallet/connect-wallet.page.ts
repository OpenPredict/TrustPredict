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
import { OptionService } from '@app/services/option-service/option.service';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';
import { StakingBalanceService } from '@app/services/staking-balance-service/staking-balance.service';

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.page.html',
  styleUrls: ['./connect-wallet.page.scss'],
})
export class ConnectWalletPage implements OnInit {

  modalHeader = 'Connect Wallet';
  modalTxt = `
    <p>
      Please ensure that:
      <ul>
        <li>You are on the Kovan test network in MetaMask</li>
        <li>You have connected a wallet to the site in the MetaMask extension</li>
      </ul>,
      then select the <b>Connect Wallet</b> button to continue.
  </p>`;

  constructor(
    // @Inject(WEB3) private web3: Web3,
    private fb: FormBuilder,
    public opEventService: OpEventService,
    public opBalanceService: OpBalanceService,
    public stakingBalanceService: StakingBalanceService,
    public optionService: OptionService,
    public _auth: AuthService,
    public _authQ: AuthQuery,
    private cryptoService: CryptoService,
    public navCtrl: NavController ) {
    }

    ngOnInit() {

    }

  /**
   * Get signer address from metamask
   */
  // async openMetamask() {
  //   try {
  //     const signer: string[] = await this.cryptoService.metamaskDefaultSigner()
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
      const signer: any = await this.cryptoService.getSigner();
      const wallet: any = await this.cryptoService.signerAddress();

      if (wallet && signer) {
        console.log('starting..');
        this._auth.login(wallet, signer);
        this.cryptoService.initContracts(wallet, signer);
        this.opEventService.setupSubscriber();
        this.opBalanceService.setupSubscriber();
        this.stakingBalanceService.setupSubscriber();
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
  //     const signer: LedgerWallet  = await this.cryptoService.ledgerDefaultSigner()
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
