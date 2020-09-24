import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LedgerWallet} from '@app/data-model';
import Transport from "@ledgerhq/hw-transport-webusb";
import { Wallet, ethers } from 'ethers';
import AppEth from "@ledgerhq/hw-app-eth";

import 'rxjs/Rx';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';

const rlp = require('rlp')
const keccak = require('keccak')

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private activeDerivation: string = `m/44'/60'/0'/0/0`
  wallet: Wallet;
  maxDecimals = 18

  constructor( public router: Router ) {}
    
  provider() {
    return new ethers.providers.Web3Provider(window.ethereum); 
  }     
  
  signer(): any {
    return this.provider().getSigner()
  }      
  
 async signerAddress() {
    return await this.signer().getAddress()
  }       
  
  /**
   * Get the default address from the window object/provider i.e metamask
   */      
  async connectWallet(): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable()
        const provider = new ethers.providers.Web3Provider(window.ethereum); 
        const accs: Array<string> = await provider.listAccounts()
        if(accs && accs.length) {
          resolve(accs)
        }          
      } catch (error) {
        reject(
          new Error(error)
        )
      }    
    })
  }       

  async ledgerDefaultSigner(): Promise<LedgerWallet> {
    return new Promise( async (resolve, reject) => {
      try {
        const transport = await Transport.create();
        const ethApp = new AppEth(transport);
        const result: LedgerWallet = await ethApp.getAddress(this.activeDerivation);        
        if(result) {
          resolve(result)
        }          
      } catch (error) {
        reject(
          new Error(error)
        )
      }    
    })
  }    
  
  /**
   * Get the default address from the window object/provider i.e metamask
   */      
  async metamaskDefaultSigner(): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable()
        const provider = new ethers.providers.Web3Provider(window.ethereum); 
        const accs: Array<string> = await provider.listAccounts()
        if(accs && accs.length) {
          resolve(accs)
        }          
      } catch (error) {
        reject(
          new Error(error)
        )
      }    
    })
  }   
  
  getSigner() {
    return new Promise( async (resolve, reject) => {
      try {
        await window.ethereum.enable()
        const provider = new ethers.providers.Web3Provider(window.ethereum); 
        const accs = provider.getSigner()
        if(accs) {
          resolve(accs)
        }          
      } catch (error) {
        reject(
          new Error(error)
        )
      }    
    })    
  }
  
/** Utils  */
getNextContractAddress(address: any, nonce: any){
  var input_arr = [ address, nonce ];
  var rlp_encoded = rlp.encode(input_arr);
  var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
  var contract_address = '0x'.concat(contract_address_long.substring(24));
  return contract_address;
}

EncodeTokenAmount(tokenAmount: any, decimalRepresentation: any, decimalsInArgument: any) {
  if(decimalRepresentation > this.maxDecimals || decimalsInArgument > this.maxDecimals){
      throw new Error('decimal encoding incorrect');
  }
  console.log(`@EncodeTokenAmount ${tokenAmount}  ${decimalRepresentation} ${decimalsInArgument} `)
  console.log(`@EncodeTokenAmount ${typeof tokenAmount}  ${typeof decimalRepresentation} ${typeof decimalsInArgument} `)  
 const tokenAmountBN = ethers.BigNumber.from(tokenAmount);
 const DecimalsBN = ethers.BigNumber.from(decimalRepresentation - decimalsInArgument);
 const tokenAmountEncoded = ethers.utils.hexValue( tokenAmountBN.mul( ethers.BigNumber.from(10).pow(DecimalsBN) ) ) 
  return tokenAmountEncoded;
}   
  
  
}
