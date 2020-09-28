import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';
import { ethers } from 'ethers';

import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { EventsStore } from './op-event.service.store';
import { IEvent } from '@app/data-model';

const OPEvent    = require('@truffle/build/contracts/OPEvent.json');
const ChainLink  = require('@truffle/build/contracts/ChainLinkToken.json');
const OPUSD      = require('@truffle/build/contracts/OPUSDToken.json');


// Dummy data events - data should come from contract
export const events: IEvent[] = [{
  id: 1,
  asset_name: "Orion Protocol",
  asset_ticker: "ORN", 
  asset_icon: "/assets/img/orn.svg", 
  condition: true,  // true high / false low
  condition_price: 10.25,
  expiration: "21.10.2020",
  created:  "20.09.2020",
  value: "5,000 USD", 
  event_contract: "0x0000000000000000000000000000000000000001",    
  event_status: {
    status_desc: "Pending"
  },     
},{
  id: 2,  
  asset_name: "Orion Protocol",
  asset_ticker: "ORN", 
  asset_icon: "/assets/img/orn.svg", 
  condition: true,  // true high / false low
  condition_price: 10.25,
  expiration: "21.10.2020",
  created:  "20.09.2020",    
  value: "60,000 USD", 
  event_contract: "0x0000000000000000000000000000000000000002",        
  event_status: {
    status_desc: "expired, withdraw deposit"
  },        
},{
  id: 3,  
  asset_name: "Orion Protocol",
  asset_ticker: "ORN", 
  asset_icon: "/assets/img/orn.svg", 
  condition: true,  // true high / false low
  condition_price: 10.25,
  expiration: "21.10.2020",
  created:  "20.09.2020",
  value: "60,000 USD", 
  event_contract: "0x0000000000000000000000000000000000000003",      
  event_status: {
    status_desc: "finished, claim rewards"
  },     
},{
  id: 4,  
  asset_name: "Ethereum",
  asset_ticker: "ETH", 
  asset_icon: "/assets/img/eth.svg", 
  condition: false,  // true high / false low
  condition_price: 50.00,    
  expiration: "21.10.2020",
  created:  "20.09.2020",
  value: "120,000 USD", 
  event_contract: "0x0000000000000000000000000000000000000004",          
  event_status: {
    status_desc: "\"O\" Tokens Minted, Lower",
    status_value: "20,000 USD",
    status_ratio: "120%"         
  },   
},{
  id: 5,  
  asset_name: "Bitcoin",
  asset_ticker: "BTC", 
  asset_icon: "/assets/img/btc.svg", 
  condition: false,  // true high / false low
  condition_price: 9000.00,    
  expiration: "31.12.2020",
  created:  "20.09.2020",
  value: "120,000 USD", 
  event_contract: "0x0000000000000000000000000000000000000005",     
  event_status: {
    status_desc: "\"OI\" Tokens Minted, Higher",
    status_value: "20,000 USD",
    status_ratio: "120%"         
  },   
}]


@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  OPEventAddress: string;
  OracleAddress: string;

  constructor(
    private crypto: CryptoService,
    private _authQ: AuthQuery,
    private opEventStr: EventsStore,
    @Inject(WEB3) private web3: Web3) { }

  async eventWager(rawBetPrice: any,
                   betSide: boolean,
                   eventPeriod: number,
                   numTokensStakedToMint: any,
                   pairContract: string ): Promise<boolean | string>{

    console.log(`Placing wager with | rawBetPrice: ${rawBetPrice}| betSide: ${betSide} | eventPeriod: ${eventPeriod} | numTokensStakedToMint: ${numTokensStakedToMint}  || pairContract: ${pairContract}`);

    return new Promise( async (resolve, reject) => {

      if (typeof betSide === undefined) {
        reject(
          new Error(`Wager is missing arguements `)
        );
      }

      // constants
      const contracts = [];
      const contractAddresses = [];
      contractAddresses['OPUSD'] = '0xB876a52ABD933a02426C31d8231e9B9352864214';
      contractAddresses['ChainLink'] = '0xa36085F69e2889c224210F603D836748e7dC0088';
      const OPUSDOptionRatio = 100;
      const priceFeedDecimals = 8;

      const _USER: any       = this._authQ.getValue();
      const _wallet: any = _USER.wallet;
      const _signer: any = _USER.signer;

      if (!_wallet || !_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }
      const betPrice        = ethers.utils.parseUnits((rawBetPrice           *              100).toString(), priceFeedDecimals - 2);
      const numTokensToMint = ethers.utils.parseUnits((numTokensStakedToMint / OPUSDOptionRatio).toString());

      const nonce = await this.web3.eth.getTransactionCount(_wallet);
      console.log('nonce:' + nonce);
      this.OPEventAddress = this.crypto.getNextContractAddress(_wallet, nonce + 2);
      this.OracleAddress  = this.crypto.getNextContractAddress(this.OPEventAddress, 1);

      contracts['ChainLink'] = new ethers.Contract(contractAddresses['ChainLink'], ChainLink.abi, _signer);
      contracts['OPUSD'] = new ethers.Contract(contractAddresses['OPUSD'], OPUSD.abi, _signer);

      try {
        const optionsCL = {};
        const optionsOP = {};
        const approveCL = contracts['ChainLink'].approve(this.OracleAddress,
                                                        ethers.utils.parseUnits('1'),
                                                        optionsCL );

        const approveOP = contracts['OPUSD'].approve(this.OPEventAddress,
                                                  ethers.utils.parseUnits(numTokensStakedToMint.toString()),
                                                  optionsOP );

        const waitForInteractions = Promise.all([approveCL, approveOP]);
        waitForInteractions.then( async (res) => {
                const approveCL = await res[0].wait();
                const approveOP = await res[1].wait();
                if (approveCL.status === 1 && approveOP.status === 1) {
                  const abi = new ethers.utils.Interface( OPEvent.abi );
                  const factory = new ethers.ContractFactory(abi, OPEvent.bytecode, _signer);
                  console.log(`Deploying contract with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
                  const contract = await factory.deploy(betPrice, Number(betSide), eventPeriod, numTokensToMint, pairContract );
                  // The contract is not mined yet but check info
                  console.log(contract.address, contract.deployTransaction);
                  // You can wait for the contract to deploy... This will reject and error if the deployment
                  // fails, for example, gas limit was too low, or the constructor called `revert`
                  await contract.deployed();
                  resolve(true);
                }
              }).catch( err =>
                reject(
                  `Error during contract deployment ${JSON.stringify(err)}`
                )
              );
      } catch (error) {
        console.log();
        reject(
          new Error(error)
        );
      }
    });
  }

  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(events),
      map(response => this.opEventStr.set(response))
    );

    return cacheable(this.opEventStr, request);
  }
  
  
  
  getEvent(id: ID) {
    const event = events.find(current => current.id === +id);
    return timer(500).pipe(
      mapTo(event),
      map(() => this.opEventStr.add(event))
    );
  }  
  
  
  
}
