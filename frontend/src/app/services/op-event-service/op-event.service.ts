import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { OptionService } from '@services/option-service/option.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';

import { ethers } from 'ethers';
const BigNumber = ethers.BigNumber;

import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { EventsStore } from './op-event.service.store';
import { IEvent, IBalance, Status, Position, Side, Token } from '@app/data-model';

const OPUSD             = require('@truffle/build/contracts/OPUSDToken.json');
const ChainLink         = require('@truffle/build/contracts/ChainLinkToken.json');
const Utils             = require('@truffle/build/contracts/Utils.json');
const Oracle            = require('@truffle/build/contracts/Oracle.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

const contractAddresses = [];
const kovan = false;

contractAddresses['OPUSD']          = kovan ? '0x168A6Ca87D06CBac65413b19afd2C7d0cd36d1AC' : '0x4C6f9E62b4EDB743608757D9D5F16B0B67B41285';
contractAddresses['ChainLink']      = kovan ? '0xa36085F69e2889c224210F603D836748e7dC0088' : '0x6c6387F01EddCd8fEcb674332D22d665c5313a90';
contractAddresses['Utils']          = kovan ? '0x3CC0CCf97178f6A14f2d2762596ab8e052A28d9E' : '0xc6ACe392cE166D3f2013302d751Bfc26C166048e';
contractAddresses['Oracle']         = kovan ? '0xbd0b4c43DA0dAFc4143C47ecf15f7E5c8Ff19E84' : '0x30690193C75199fdcBb7F588eF3F966402249315';
contractAddresses['TrustPredict']   = kovan ? '0x71b388f51d95cc5a6E983D7e9D5ceCFf1b54293C' : '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C';
contractAddresses['OPEventFactory'] = kovan ? '0xec71D6030Ac5DE2bc4849A9dE9CE0131381d3F62' : '0x4eb24Db3F49F82A475281d49D3d327f623B6e3dA';

@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  events = {} as IEvent;
  balances = {} as IBalance;

  address = '';
  depositPeriod = 10;
  minimumTokenAmountPerEvent = BigNumber.from(ethers.utils.parseUnits('10'));

  constructor(
    private crypto: CryptoService,
    private authQ: AuthQuery,
    private optService: OptionService,
    private eventsStore: EventsStore,
    @Inject(WEB3) private web3: Web3) {
      this.events = {};
      this.balances = {};
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

      const totalBalance = BigNumber.from(tokenBalances[0]).add(BigNumber.from(tokenBalances[1]));

      ethers.utils.formatUnits(tokenBalances[0].add(tokenBalances[1]).valueOf().toString());

      const eventEntry = {
        id: eventId,
        asset_name: asset.name,
        asset_ticker: ticker,
        asset_icon: asset.icon,
        side: Number(eventData['betSide']),
        creator: eventData['creator'],
        condition_price: ethers.utils.formatUnits(eventData['betPrice'].valueOf().toString(), 8).toString(),
        settled_price: ethers.utils.formatUnits(eventData['settledPrice'].valueOf().toString(), 8).toString(),
        winner: Number(eventData['winner']),
        completion: this.timeConverter(eventData['endTime']),
        created:  this.timeConverter(eventData['startTime']),
        status: this.parseEventStatus(eventData, totalBalance),
        value: ethers.utils.formatUnits(totalBalance.mul(100).toString()).toString() + ' USD',
        ratio: parseFloat(ethers.utils.formatUnits(eventData['amountPerWinningToken']).toString()).toFixed(2) + '%'
      };

      this.events[eventId] = eventEntry;
      (eventId in this.events) ? this.eventsStore.upsert(eventId, eventEntry) :
                                 this.eventsStore.add(eventEntry, { prepend: true });

      console.log('events length after push: ' + Object.keys(this.events).length);
    }

    async setupBalanceSubscriber(trustPredict, walletAddress){


      // You can also pull in your JSON ABI; I'm not sure of the structure inside artifacts
      //
      const abi = new ethers.utils.Interface([
        'event TransferFrom(address,address,address,uint256,uint8)'
      ]);

      this.crypto.provider().on( {
          address: trustPredict.address,
          topics: [
              ethers.utils.id('TransferFrom(address,address,address,uint256,uint8)'),
            ],
        }, async (log) => {
          const events = abi.parseLog(log);
          const from = events['args'][1];
          const   to = events['args'][2];
          console.log('from: ' + from);
          console.log('to: ' + to);
          console.log('walletAddress: ' + walletAddress);
          if (from === walletAddress || to === walletAddress) {
            const eventId = events['args'][0];
            const amount = ethers.BigNumber.from(events['args'][3]);
            const selection = events['args'][4];

            console.log('eventId: ' + eventId);
            console.log('amount: ' + amount);
            console.log('selection: ' + selection);
            // If this is the first call just get balances from the chain. otherwise update from log.
            if (!(eventId in this.balances)) {
              // get initial balances
              const balances = await trustPredict.getTokenBalances(eventId);
              console.log('balances: ' + balances);
              const balanceEntry = {
                IOToken: BigNumber.from(balances[0]),
                 OToken: BigNumber.from(balances[1]),
              };
              this.balances[eventId] = balanceEntry;
            } else {
              if (to === walletAddress) {
                console.log('Balance add - to wallet address from: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? this.balances[eventId].IOToken = this.balances[eventId].IOToken.add(amount)
                                  : this.balances[eventId].OToken  = this.balances[eventId].OToken.add(amount);
              }
              if (from === walletAddress) {
                console.log('Balance sub - from wallet address to: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? this.balances[eventId].IOToken = this.balances[eventId].IOToken.sub(amount)
                                  : this.balances[eventId].OToken  = this.balances[eventId].OToken.sub(amount);
              }
            }
            console.log('balances: ' + JSON.stringify(this.balances[eventId]));
          }
        });
    }

    async setupEventSubscriber(){
      // OPEventFactory initial data gathering
      const _USER: any  = this.authQ.getValue();
      const signer: any = _USER.signer;

      this.address = await signer.getAddress();
      console.log('signer address: ' + this.address);

      const contracts = [];
      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, signer);
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, signer);

      this.setupBalanceSubscriber(contracts['TrustPredict'], this.address);

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
                  console.log(`Placing stake with | eventId: ${eventId}| numTokensToMint: ${numTokensToMint} || selection: ${selection}`);
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
            await contracts['OPEventFactory'].claim(eventId);
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

  async transferFrom(eventId: string,
                     to: string,
                     amount: number,
                     selection: Token){
    return new Promise( async (resolve, reject) => {
      // constants
      const contracts = [];

      const _USER: any       = this.authQ.getValue();
      const _signer: any = _USER.signer;

      // parse values for contract call
      const from = _signer.getAddress();
      const amountEncoded = ethers.utils.parseUnits(amount.toString());

      // log
      console.log('eventId: ' + eventId);
      console.log('from: ' + from.address);
      console.log('to: ' + to);
      console.log('amountEncoded: ' + amountEncoded.toString());
      console.log('selection: ' + selection);

      if (!_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, _signer);
      try {
        const optionsTP = {};
        const transferTP = contracts['TrustPredict'].transferFrom(eventId, from, to, amountEncoded, selection, optionsTP);
        const waitForInteractions = Promise.all([transferTP]);
        waitForInteractions.then( async (res) => {
          const transferTPWait = await res[0].wait();
          if (transferTPWait.status === 1) {
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

  async balanceOfAddress(eventId, address) {
      console.log('eventId: ' + eventId);
      console.log('address: ' + address);

      const _USER: any  = this.authQ.getValue();
      const signer: any = _USER.signer;

      const contracts = [];
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, signer);

      let balanceO = await contracts['TrustPredict'].balanceOfAddress(eventId, address, 0);
      console.log('balanceO: ' + balanceO);
      let balanceIO = await contracts['TrustPredict'].balanceOfAddress(eventId, address, 1);
      console.log('balanceIO: ' + balanceIO);

      balanceO = Number(ethers.utils.formatUnits(balanceO.toString()).toString());
      balanceIO = Number(ethers.utils.formatUnits(balanceIO.toString()).toString());

      console.log('balanceO encoded: ' + balanceO);
      console.log('balanceIO encoded: ' + balanceIO);

      return [balanceO, balanceIO];
  }

  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(Object.values(this.events)),
      map(response => this.eventsStore.set(response))
    );

    return cacheable(this.eventsStore, request);
  }



  getEvent(id: ID) {
    return timer(500).pipe(
      mapTo(Object.values(this.events)),
      map(() => this.eventsStore.add(this.events[id]))
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

  parseTokenAmount(amount) {
    return ethers.utils.formatUnits(amount).toString();
  }

  /**
   * Return text depending on if the conditionis true/false
   * @param condition boolean
   */
  getConditionText(position: Position) {
    return (position === Position.Left) ? 'higher than' : 'lower than';
  }

  getStatusText(event: any) {
    return  (event.status === Status.Staking) ? 'Staking in Progress' :
            (event.status === Status.Settled) ? 'Settled'             :
            (event.status === Status.Expired) ? 'Expired'             :
            'Active (Staking Complete)';
  }
}
