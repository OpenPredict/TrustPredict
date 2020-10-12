import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { OptionService } from '@services/option-service/option.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';

import { ethers } from 'ethers';

import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { EventsStore } from './op-event.service.store';
import { IEvent, Status, Position, Side } from '@app/data-model';

const OPUSD             = require('@truffle/build/contracts/OPUSDToken.json');
const ChainLink         = require('@truffle/build/contracts/ChainLinkToken.json');
const Utils             = require('@truffle/build/contracts/Utils.json');
const Oracle            = require('@truffle/build/contracts/Oracle.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  events: IEvent[];

  depositPeriod = 10;
  minimumTokenAmountPerEvent = ethers.BigNumber.from(ethers.utils.parseUnits('100'));

  constructor(
    private crypto: CryptoService,
    private authQ: AuthQuery,
    private optService: OptionService,
    private opEventStr: EventsStore,
    @Inject(WEB3) private web3: Web3) {
      this.events = [];
    }

    timeConverter(timestamp) {
      const a = new Date(timestamp * 1000);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const year = a.getFullYear();
      const month = months[a.getMonth()];
      const date = a.getDate();
      const hour = a.getHours();
      const min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
      const sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
      const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
      return time.toString();
    }

    parseEventStatus(eventData, totalBalance: ethers.BigNumber) {
      const date = new Date();
      return  (date < new Date(this.timeConverter(eventData['startTime'])))
              ? Status.Staking :
              (eventData['eventSettled'] === true)
              ? Status.Settled :
              (date > new Date(this.timeConverter(eventData['startTime'])) && totalBalance.lt(this.minimumTokenAmountPerEvent))
              ? Status.Expired :
              Status.Active;
    }

    async parseEventData(eventId, eventData, tokenBalances){

      const pairing = this.optService.availablePairs[eventData['priceAggregator']];
      const ticker = pairing.pair.replace('/USD', '');
      const asset = this.optService.availableAssets[ticker];

      const totalBalance = ethers.BigNumber.from(tokenBalances[0]).add(ethers.BigNumber.from(tokenBalances[1]));

      ethers.utils.formatUnits(tokenBalances[0].add(tokenBalances[1]).valueOf().toString());

      const eventEntry = {
        id: eventId,
        asset_name: asset.name,
        asset_ticker: ticker,
        asset_icon: asset.icon,
        side: Number(eventData['betSide']),
        creator: eventData['creator'],
        condition_price: ethers.utils.formatUnits(eventData['betPrice'].valueOf().toString(), 8).toString(),
        completion: this.timeConverter(eventData['endTime']),
        created:  this.timeConverter(eventData['startTime']),
        status: this.parseEventStatus(eventData, totalBalance),
        value: ethers.utils.formatUnits(totalBalance.mul(100).toString()).toString() + ' USD',
        ratio: ''
      };

      // Try to find existing event, if not add new.
      let found = false;
      await Promise.all(this.events.map(async (_event, index) => {
        if (_event.id === eventId) {
          this.events[index] = eventEntry;
          found = true;
        }
      }));

      if (!found) {
        console.log('pushing new event ');
        this.events.push(eventEntry);
        this.opEventStr.add(eventEntry, { prepend: true });
      }
      console.log('events length after push: ' + Object.keys(this.events).length);
    }

    async setupEventSubscriber(){
      // OPEventFactory initial data gathering
      const _USER: any  = this.authQ.getValue();
      const signer: any = _USER.signer;

      const contracts = [];
      const contractAddresses = [];
      contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';
      contractAddresses['TrustPredict'] = '0x30690193C75199fdcBb7F588eF3F966402249315';
      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, signer);
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, signer);

      contracts['OPEventFactory'].getNonce().then(async (lastNonce) => {
          console.log('lastNonce: ' + lastNonce);
          const nonceRange = [...Array(parseInt(lastNonce)).keys()];
          console.log('nonceRange: ' + nonceRange);
          await Promise
          .all(nonceRange
          .filter(nonce => nonce > 0)
          .map(async (nonce) => {
            const eventID = this.crypto.getNextContractAddress(contracts['OPEventFactory'].address, nonce);
            console.log('\nEvent ID: ' + eventID);
            const eventData = await contracts['OPEventFactory'].getEventData(eventID);
            console.log('\nEvent Data: ' + eventData);
            const balances = await contracts['TrustPredict'].getTokenBalances(eventID);
            await this.parseEventData(eventID, eventData, balances);
          }));
        });

        // OPEventFactory subscriber
      this.crypto.provider().on( {
          address: contracts['OPEventFactory'].address,
          topics: [ethers.utils.id('EventUpdate(address)')], // OPEventFactory
        }, async (eventIdRaw) => {
          const eventID = '0x' + eventIdRaw.data.substring(26);
          console.log('eventID subscriber: ' + eventID);
          console.log('events length: ' + Object.keys(this.events).length);
          const eventData = await contracts['OPEventFactory'].getEventData(eventID);
          const balances = await contracts['TrustPredict'].getTokenBalances(eventID);
          await this.parseEventData(eventID, eventData, balances);
        });
    }

  async launchEvent(rawBetPrice: number,
                    betSide: boolean,
                    eventPeriod: number,
                    numTokensStakedToMint: number,
                    pairContract: string ): Promise<boolean | string>{

    console.log(`Launch event with | rawBetPrice: ${rawBetPrice}| betSide: ${betSide} | eventPeriod: ${eventPeriod} | numTokensStakedToMint: ${numTokensStakedToMint}  || pairContract: ${pairContract}`);

    return new Promise( async (resolve, reject) => {

      if (typeof betSide === undefined) {
        reject(
          new Error(`Wager is missing arguements `)
        );
      }

      // constants
      const contracts = [];
      const contractAddresses = [];
      // Contract Addresses (local)
      contractAddresses['OPUSD'] = '0xBf610614CaA08d9fe7a4F61082cc32951e547a91';
      contractAddresses['ChainLink'] = '0x4C6f9E62b4EDB743608757D9D5F16B0B67B41285';
      contractAddresses['Utils'] = '0x6c6387F01EddCd8fEcb674332D22d665c5313a90';
      contractAddresses['Oracle'] = '0xc6ACe392cE166D3f2013302d751Bfc26C166048e';
      contractAddresses['TrustPredict'] = '0x30690193C75199fdcBb7F588eF3F966402249315';
      contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';

      const OPUSDOptionRatio = 100;
      const priceFeedDecimals = 8;

      const _USER: any       = this.authQ.getValue();
      const _wallet: any = _USER.wallet;
      const _signer: any = _USER.signer;

      if (!_wallet || !_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      const betPrice        = ethers.utils.parseUnits((rawBetPrice           *              100).toString(), priceFeedDecimals - 2);
      const numTokensToMint = ethers.utils.parseUnits((numTokensStakedToMint / OPUSDOptionRatio).toString());
      console.log(numTokensToMint);
      contracts['ChainLink'] = new ethers.Contract(contractAddresses['ChainLink'], ChainLink.abi, _signer);
      contracts['OPUSD'] = new ethers.Contract(contractAddresses['OPUSD'], OPUSD.abi, _signer);
      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, _signer);

      try {
        const optionsCL = {};
        const optionsOP = {};
        const approveCL = contracts['ChainLink'].approve(contractAddresses['Oracle'],
                                                        ethers.utils.parseUnits('1'),
                                                        optionsCL );

        const approveOP = contracts['OPUSD'].approve(contractAddresses['OPEventFactory'],
                                                  ethers.utils.parseUnits(numTokensStakedToMint.toString()),
                                                  optionsOP );

        const waitForInteractions = Promise.all([approveCL, approveOP]);
        waitForInteractions.then( async (res) => {
          const approveCLWait = await res[0].wait();
          const approveOPWait = await res[1].wait();
          if (approveCLWait.status === 1 && approveOPWait.status === 1) {
            console.log(`Deploying event with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
            await contracts['OPEventFactory'].createOPEvent(betPrice,
                                                            Number(betSide),
                                                            eventPeriod,
                                                            numTokensToMint,
                                                            pairContract );
            resolve(true);
          }
        }).catch( err =>
          reject(
            `Error during transaction creation: ${JSON.stringify(err)}`
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

  async stake(eventId: string,
              numTokensStakedToMint: number,
              selection: number){

          return new Promise( async (resolve, reject) => {

            // constants
            const contracts = [];
            const contractAddresses = [];
            // Contract Addresses (local)
            contractAddresses['OPUSD'] = '0xBf610614CaA08d9fe7a4F61082cc32951e547a91';
            contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';

            const OPUSDOptionRatio = 100;
            const priceFeedDecimals = 8;

            const _USER: any       = this.authQ.getValue();
            const _wallet: any = _USER.wallet;
            const _signer: any = _USER.signer;

            if (!_wallet || !_signer) {
              reject(
                new Error(`Please log in via Metamask!`)
              );
            }

            const numTokensToMint = ethers.utils.parseUnits((numTokensStakedToMint / OPUSDOptionRatio).toString());
            console.log(numTokensToMint);
            contracts['OPUSD'] = new ethers.Contract(contractAddresses['OPUSD'], OPUSD.abi, _signer);
            contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, _signer);

            try {
              const optionsOP = {};
              const approveOP = contracts['OPUSD'].approve(contractAddresses['OPEventFactory'],
                                                        ethers.utils.parseUnits(numTokensStakedToMint.toString()),
                                                        optionsOP );

              const waitForInteractions = Promise.all([approveOP]);
              waitForInteractions.then( async (res) => {
                const approveOPWait = await res[0].wait();
                if (approveOPWait.status === 1) {
                  console.log(`Placing stake with | eventId: ${eventId}| numTokensStakedToMint: ${numTokensStakedToMint} || selection: ${selection}`);
                  await contracts['OPEventFactory'].stake(eventId, numTokensToMint, selection);
                  resolve(true);
                }
              }).catch( err =>
                reject(
                  `Error during transaction creation: ${JSON.stringify(err)}`
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

  async revoke(eventId: string){
    return new Promise( async (resolve, reject) => {
      // constants
      const contracts = [];
      const contractAddresses = [];
      // Contract Addresses (local)
      contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';
      contractAddresses['TrustPredict'] = '0x30690193C75199fdcBb7F588eF3F966402249315';

      const _USER: any       = this.authQ.getValue();
      const _signer: any = _USER.signer;

      if (!_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, _signer);
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, _signer);

      try {
        const optionsTP = {};
        const approveTP = contracts['TrustPredict'].setApprovalForAll(contractAddresses['OPEventFactory'],
                                                    true,
                                                    optionsTP );

        const waitForInteractions = Promise.all([approveTP]);
        waitForInteractions.then( async (res) => {
          const approveTPWait = await res[0].wait();
          if (approveTPWait.status === 1) {
            await contracts['OPEventFactory'].revoke(eventId);
            resolve(true);
          }
        }).catch( err =>
          reject(
            `Error during transaction creation: ${JSON.stringify(err)}`
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

  async claim(eventId: string){
    return new Promise( async (resolve, reject) => {
      // constants
      const contracts = [];
      const contractAddresses = [];
      // Contract Addresses (local)
      contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';

      const _USER: any       = this.authQ.getValue();
      const _signer: any = _USER.signer;

      if (!_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, _signer);
      try {
        const waitForInteractions = Promise.all([]);
        waitForInteractions.then( async (res) => {
          await contracts['OPEventFactory'].claim(eventId);
          resolve(true);
        }).catch( err =>
          reject(
            `Error during transaction creation: ${JSON.stringify(err)}`
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

  async balanceForAddress(eventId, address) {
      // OPEventFactory initial data gathering
      const _USER: any  = this.authQ.getValue();
      const signer: any = _USER.signer;

      const contracts = [];
      const contractAddresses = [];
      contractAddresses['OPEventFactory'] = '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';
      contractAddresses['TrustPredict'] = '0x30690193C75199fdcBb7F588eF3F966402249315';
      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, signer);
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, signer);

      const balanceO = await contracts['TrustPredict'].balanceForAddress(eventId, address, 0);
      const balanceIO = await contracts['TrustPredict'].balanceForAddress(eventId, address, 1);

      console.log('balanceO: ' + balanceO);
      console.log('balanceIO: ' + balanceIO);

      return Number(balanceO) + Number(balanceIO);
  }

  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(this.events),
      map(response => this.opEventStr.set(response))
    );

    return cacheable(this.opEventStr, request);
  }



  getEvent(id: ID) {
    const event = this.events.find(current => current.id === +id);
    return timer(500).pipe(
      mapTo(this.events),
      map(() => this.opEventStr.add(event))
    );
  }


  /**
   * Return a class depending on if the condition is true/false
   * @param condition boolean
   */
  getClass(position: Position) {
    return (position === Position.Left) ? 'status-green' : 'status-red';
  }

  /**
   * Return text depending on if the conditionis true/false
   * @param condition boolean
   */
  getToken(position: Position, betSide: Side) {
    // if LHS and Higher, or RHS and Lower, return O. else IO.
    return ((position === Position.Left && betSide === Side.Higher) ||
            (position !== Position.Left && betSide !== Side.Higher)) ?
            'O' :
            'IO';
  }

  /**
   * Return text depending on if the conditionis true/false
   * @param condition boolean
   */
  getConditionText(position: Position) {
    return (position === Position.Left) ? 'higher than' : 'lower than';
  }

  getStatusText(event: any) {
    return  (event.status === Status.Staking) ? 'Staking in Progress'       :
            (event.status === Status.Settled) ? 'Settled, Claim Rewards'    :
            (event.status === Status.Expired) ? 'Expired, Withdraw Deposit' :
            'Active (Staking Complete): ' + (event.betSide === 1 ? 'Higher ' : 'Lower ') + 'than ' + event.condition_price + ' USD';
  }
}
