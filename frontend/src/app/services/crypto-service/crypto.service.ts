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
            'USDC'           : '0xb876a52abd933a02426c31d8231e9b9352864214',
            'Utils'          : '0xaFfAa8Bd46155e536FF863Cad355a237B8102142',
            'Oracle'         : '0x16406518B81e70E131357F8eC53C6c8F604EBdB4',
            'TrustPredict'   : '0xb91208C000f75f1564663A53109F08BdC8dF7a60',
            'OPEventFactory' : '0xeBabC1c93fc645a9C47CC4373FE456fD6791660c',
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
          'USDC'           : this.getNextContractAddress(this.account, 0),
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

    this.optionService.contracts['USDC'] = new ethers.Contract(
      this.contractAddresses['USDC'],
      ERC20.abi,
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
