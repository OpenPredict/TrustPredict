import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LedgerWallet} from '@app/data-model';
import Transport from '@ledgerhq/hw-transport-webusb';
import { Wallet, ethers } from 'ethers';
import AppEth from '@ledgerhq/hw-app-eth';

import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import { AuthService } from '../auth-service/auth.service';
import { OpEventService } from '../op-event-service/op-event.service';

const rlp = require('rlp');
const keccak = require('keccak');

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private activeDerivation = `m/44'/60'/0'/0/0`;
  wallet: Wallet;
  maxDecimals = 18;
  _provider = null;

  constructor(
    public router: Router,
    // public _auth: AuthService,
    // public opEvent: OpEventService
    ) {}

  netChange() {
    // const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    // provider.on("network", (newNetwork, oldNetwork) => {
    //     if (oldNetwork) {
    //         window.location.reload();
    //     }
    // });
  }


  provider() {
    if (this._provider === null){
      window.ethereum.enable().then(this._provider = new ethers.providers.Web3Provider(window.ethereum));
    }
    return this._provider;
  }

  signer(): any {
    return this.provider().getSigner();
  }

 async signerAddress() {
    return await this.signer().getAddress();
  }

  /**
   * Get the default address from the window object/provider i.e metamask
   */
  async connectWallet(): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const accs: Array<string> = await provider.listAccounts();
        if (accs && accs.length) {
          resolve(accs);
        }
      } catch (error) {
        reject(
          new Error(error)
        );
      }
    });
  }

  async ledgerDefaultSigner(): Promise<LedgerWallet> {
    return new Promise( async (resolve, reject) => {
      try {
        const transport = await Transport.create();
        const ethApp = new AppEth(transport);
        const result: LedgerWallet = await ethApp.getAddress(this.activeDerivation);
        if (result) {
          resolve(result);
        }
      } catch (error) {
        reject(
          new Error(error)
        );
      }
    });
  }

  /**
   * Get the default address from the window object/provider i.e metamask
   */
  async metamaskDefaultSigner(): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accs: Array<string> = await provider.listAccounts();
        if (accs && accs.length) {
          resolve(accs);
        }
      } catch (error) {
        reject(
          new Error(error)
        );
      }
    });
  }

  getSigner() {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accs = provider.getSigner();
        if (accs) {
          resolve(accs);
        }
      } catch (error) {
        reject(
          new Error(error)
        );
      }
    });
  }

/** Utils  */
getNextContractAddress(address: any, nonce: any){
  const inputArr = [ address, nonce ];
  const rlpEncoded = rlp.encode(inputArr);
  const contractAddressLong = keccak('keccak256').update(rlpEncoded).digest('hex');
  const contractAddress = '0x'.concat(contractAddressLong.substring(24));
  return contractAddress;
}

EncodeTokenAmount(tokenAmount: any, decimalRepresentation: any, decimalsInArgument: any) {
  if (decimalRepresentation > this.maxDecimals || decimalsInArgument > this.maxDecimals){
      throw new Error('decimal encoding incorrect');
  }
  console.log(`@EncodeTokenAmount ${tokenAmount}  ${decimalRepresentation} ${decimalsInArgument} `);
  console.log(`@EncodeTokenAmount ${typeof tokenAmount}  ${typeof decimalRepresentation} ${typeof decimalsInArgument} `);
  const tokenAmountBN = ethers.BigNumber.from(tokenAmount);
  const DecimalsBN = ethers.BigNumber.from(decimalRepresentation - decimalsInArgument);
  const tokenAmountEncoded = ethers.utils.hexValue( tokenAmountBN.mul( ethers.BigNumber.from(10).pow(DecimalsBN) ) );
  return tokenAmountEncoded;
}


}
