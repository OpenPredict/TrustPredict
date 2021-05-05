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
import { BehaviorSubject, Observable } from 'rxjs';
import { OpEventService } from '../op-event-service/op-event.service';

const ERC20             = require('@truffle/build/contracts/ERC20.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

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
  private _currentNetwork = new BehaviorSubject<string>('');
  $currentNetwork: Observable<Readonly<string>> = this._currentNetwork.asObservable()

  account = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'; // ganache-cli -d account 0

  contractAddresses: any = {};
  contractData: any = {};

  constructor(
    public router: Router,
    private storage: Storage,
    private auth: AuthService,
    public optionService: OptionService ) {
      this.$currentNetwork.subscribe( (networkName) => {
        console.log('network: ' + networkName);
        if (networkName === 'homestead'){ // mainnet
        }
        if (networkName === 'kovan'){
          this.contractAddresses = { // TODO
            'Asset'           : '0x532f3efA415e5bB62b13D31e93639041e7C21164',
            'Utils'           : '0xB3Ad8c0d2aCdeFc4B07026FD5B846a7D24ff6EF0',
            'Oracle'          : '0xF829E186eE77C3F2104EccEB8C78173A6F470049',
            'TrustPredict'    : '0xf90163a36953aB2648Da3EAF26166Ff0d087B05D',
            'OPEventFactory'  : '0x3456668ce3c64cc567FdCfea71bAD7f6E6aa6635',
          };
          this.contractData = { // TODO
            'Asset'           : {symbol: 'USDC', decimals: 18 },
          };
          optionService.depositPeriod = 86400;
        }
        if (networkName === 'unknown') { // localhost
          console.log('contract addresses: ');
          console.log(this.getNextContractAddress(this.account, 0));
          console.log(this.getNextContractAddress(this.account, 1));
          console.log(this.getNextContractAddress(this.account, 2));
          console.log(this.getNextContractAddress(this.account, 3));
          console.log(this.getNextContractAddress(this.account, 4));
          this.contractAddresses = {
          'Asset'          : this.getNextContractAddress(this.account, 0),
          'Utils'          : this.getNextContractAddress(this.account, 1),
          'Oracle'         : this.getNextContractAddress(this.account, 2),
          'TrustPredict'   : this.getNextContractAddress(this.account, 3),
          'OPEventFactory' : this.getNextContractAddress(this.account, 4),
          };
          optionService.depositPeriod = 200;
        }
      });
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

    this._currentNetwork.next(network.name);
    
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

    this.optionService.contracts['Asset'] = new ethers.Contract(
      this.contractAddresses['Asset'],
      ERC20.abi,
      signer);

      this.optionService.abis['OPEventFactory'] = new ethers.utils.Interface(OPEventFactory.abi);
      this.optionService.abis['TrustPredict'] = new ethers.utils.Interface(TrustPredictToken.abi);
      this.optionService.abis['Asset'] = new ethers.utils.Interface(ERC20.abi);
    
    console.log('resetting events block..');
    //this.provider().resetEventsBlock(0);
    console.log('done.');
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
