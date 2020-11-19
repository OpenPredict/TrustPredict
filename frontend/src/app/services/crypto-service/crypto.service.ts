import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LedgerWallet} from '@app/data-model';
import Transport from '@ledgerhq/hw-transport-webusb';
import { Wallet, ethers } from 'ethers';
import AppEth from '@ledgerhq/hw-app-eth';
import { Storage } from '@ionic/storage';

import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';

import { OptionService } from '../option-service/option.service';
import { AuthService } from '../auth-service/auth.service';

const OPUSD             = require('@truffle/build/contracts/OPUSDToken.json');
const ChainLink         = require('@truffle/build/contracts/ChainLinkToken.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

const rlp = require('rlp');
const keccak = require('keccak');

const kovan = false;

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private activeDerivation = `m/44'/60'/0'/0/0`;
  wallet: Wallet;
  maxDecimals = 18;
  _provider = null;

  account = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'; // ganache-cli -d account 0

  contractAddresses: any = {
    'ContractProxy'  : (kovan) ? '0x328eC87d3AE746169DF56089ED96DEa8e34453B1' : this.getNextContractAddress(this.account, 0),
    'OPUSD'          : (kovan) ? '0xb876a52abd933a02426c31d8231e9b9352864214' : this.getNextContractAddress(this.account, 1),
    'ChainLink'      : (kovan) ? '0xa36085f69e2889c224210f603d836748e7dc0088' : this.getNextContractAddress(this.account, 2),
    'Utils'          : (kovan) ? '0xec08ead8f3ea1be6b6ea17ccf80df0a4cf379033' : this.getNextContractAddress(this.account, 3),
    'Oracle'         : (kovan) ? '0x892Ef27cC1B1A46646CB064f8d12EE66F74BEFc7' : this.getNextContractAddress(this.account, 4),
    'TrustPredict'   : (kovan) ? '0xb1D9A08BA7d5184829Fa7f84A839Ec98607415dE' : this.getNextContractAddress(this.account, 5),
    'OPEventFactory' : (kovan) ? '0x0d1a8Cd518f5DEE399584461d00292f964C3B31d' : this.getNextContractAddress(this.account, 6),
  };

  constructor(
    public router: Router,
    private storage: Storage,
    private auth: AuthService,
    public optionService: OptionService ) {}

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
        // await window.ethereum.enable();
        await this.setProvider()
        const accs: Array<string> = await this._provider.listAccounts();
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


  async setProvider(type?: number) {
    return new Promise( async (resolve, reject) => {
      try {
        let selectedProvider: any
          await window.ethereum.enable()
          selectedProvider = window.ethereum
        this._provider = new ethers.providers.Web3Provider(selectedProvider)    
        if(this._provider) {
          const login = await this.onConnect()        
          return resolve(login)                
        } else {
          throw `invalid provider`
        }
      } catch (error) {
        return reject(
          new Error(
            error
          )
        )
      }
    })
  }
      

  async onNetworkChange() {
    // await window.ethereum.enable();
    // as specified in EIP 1193 https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md
    window.ethereum.on("close", () => this.resetApp());
    window.ethereum.on("networkChanged", async (chainId: number) => {
      const lastChainId = await this.storage.get("chainId");
      if (String(chainId) !== String(lastChainId)) {
        this.storage.set("chainId", chainId); 
        window.location.reload();
      }   
    });  
    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts) {
        this.onConnect();
      }
    });    
  }

  async onConnect() {
    this.onNetworkChange()
    const signer: ethers.providers.JsonRpcSigner =  await this._provider.getSigner()
    
    const wallet = await signer.getAddress()
    
    const network = await this._provider.getNetwork()      
    
    this.storage.set("chainId", network.chainId);   // store chain id in local storage to prevent distributed reload bug
    
    const authState: any = {
      wallet,
      signer,
      chainId: network.chainId,
      chainName: network.name,
      provider: this._provider
    }
    this.auth.login(authState);
    return authState
  } 
  
  public resetApp = async () => {
    this.auth.logout()
  };      
  
  
  

  
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

  initContracts(address, signer){
    console.log('setting address..');
    this.optionService.address = address;
    this.optionService.signer = signer;

    this.optionService.contracts['OPEventFactory'] = new ethers.Contract(
      this.contractAddresses['OPEventFactory'],
      OPEventFactory.abi,
      signer);

    this.optionService.contracts['TrustPredict'] = new ethers.Contract(
      this.contractAddresses['TrustPredict'],
      TrustPredictToken.abi,
      signer);

    this.optionService.contracts['OPUSD'] = new ethers.Contract(
      this.contractAddresses['OPUSD'],
      OPUSD.abi,
      signer);

    this.optionService.contracts['ChainLink'] = new ethers.Contract(
        this.contractAddresses['ChainLink'],
        ChainLink.abi,
        signer);

    this.provider().resetEventsBlock(0);
  }

/** Utils  */
private getNextContractAddress(address: any, nonce: any) {
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
