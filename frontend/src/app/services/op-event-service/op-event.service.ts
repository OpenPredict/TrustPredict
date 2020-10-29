import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { OptionService } from '@services/option-service/option.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';

import { ethers } from 'ethers';
const BigNumber = ethers.BigNumber;

import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { EventsStore } from './op-event.service.store';
import { IEvent, IBalance, Status, Position, Side, Token } from '@app/data-model';
import { OpBalanceService } from '../op-balance-service/op-balance.service';

const ContractProxy     = require('@truffle/build/contracts/ContractProxy.json');
const OPUSD             = require('@truffle/build/contracts/OPUSDToken.json');
const ChainLink         = require('@truffle/build/contracts/ChainLinkToken.json');
const Utils             = require('@truffle/build/contracts/Utils.json');
const Oracle            = require('@truffle/build/contracts/Oracle.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

const contracts = [];
const contractAddresses = [];
const kovan = true;

@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  events = {} as IEvent;

  address = '';
  depositPeriod = 200;
  minimumTokenAmountPerEvent = BigNumber.from(ethers.utils.parseUnits('10'));
  constructor(
    private crypto: CryptoService,
    private authQuery: AuthQuery,
    private optService: OptionService,
    private eventsStore: EventsStore,
    private balanceService: OpBalanceService,
    @Inject(WEB3) private web3: Web3) {}

    updateStatusFollowingDepositPeriod(depositPeriodEnd, eventId) {
      // set a timer to update the status following depositPeriodEnd.
      setTimeout(() => {
          console.log('ending timeout for eventId ' + eventId);
          const eventEntry = this.events[eventId];
          // call status update function, upsert result
          const totalTokenValue = eventEntry.token_values_raw[0].add(eventEntry.token_values_raw[1]);

          console.log('ending timeout for eventId ' + eventId);
          console.log('totalTokenValue ' + totalTokenValue);
          console.log('this.minimumTokenAmountPerEvent ' + this.minimumTokenAmountPerEvent);
          const isDepositPeriod = (new Date() < new Date(this.timestampToDate(eventEntry.deposit_period_end)));
          const status =   isDepositPeriod                                                           ? Status.Staking :
                           eventEntry.Status === Status.Settled                                      ? Status.Settled :
                           !isDepositPeriod && (totalTokenValue.lt(this.minimumTokenAmountPerEvent)) ? Status.Expired :
                                                                                                       Status.Active;

          console.log('new status: ' + status);

          const eventEntryNew = {
            id: this.events[eventId].id,
            asset_name: this.events[eventId].asset_name,
            asset_ticker: this.events[eventId].asset_ticker,
            asset_icon: this.events[eventId].asset_icon,
            side: this.events[eventId].side,
            creator: this.events[eventId].creator,
            condition_price: this.events[eventId].condition_price,
            settled_price: this.events[eventId].settled_price,
            winner: this.events[eventId].winner,
            creation: this.events[eventId].creation,
            deposit_period_end: this.events[eventId].deposit_period_end,
            completion: this.events[eventId].completion,
            status: status,
            staked_values: this.events[eventId].staked_values,
            staked_values_raw: this.events[eventId].staked_values_raw,
            token_values: this.events[eventId].token_values,
            token_values_raw: this.events[eventId].token_values_raw,
            ratio: this.events[eventId].ratio,
          };

          this.events[eventId] = eventEntryNew;
          this.eventsStore.upsert(eventId, eventEntryNew);
      }, depositPeriodEnd);
   }

    timestampToDate(timestamp) {
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

    parseEventStatus(eventData, tokenValuesRaw: ethers.BigNumber[]) {
      const totalTokenValue = tokenValuesRaw[0].add(tokenValuesRaw[1]);
      const isDepositPeriod = (new Date() < new Date(this.timestampToDate(Number(eventData['startTime']))));
      return  isDepositPeriod                                                         ? Status.Staking :
              (eventData['eventSettled'] === true)                                    ? Status.Settled :
              !isDepositPeriod && totalTokenValue.lt(this.minimumTokenAmountPerEvent) ? Status.Expired :
                                                                                        Status.Active;
    }

    async parseEventData(eventId, eventData, tokenValuesRaw){
      console.log('priceAggregator: ' + eventData['priceAggregator']);
      const pairing = this.optService.availablePairs[eventData['priceAggregator']];
      console.log('pairing: ' + pairing);

      const ticker = pairing.pair.replace('/USD', '');
      const asset = this.optService.availableAssets[ticker];

      const tokenValues = [parseFloat(ethers.utils.formatUnits(BigNumber.from(tokenValuesRaw[Token.IO]))),
                           parseFloat(ethers.utils.formatUnits(BigNumber.from(tokenValuesRaw[Token.O])))];

      const stakedValuesRaw = [tokenValuesRaw[Token.IO].mul(100), tokenValuesRaw[Token.O].mul(100)];
      const stakedValues = [parseFloat(ethers.utils.formatUnits(BigNumber.from(stakedValuesRaw[Token.IO]))),
                           parseFloat(ethers.utils.formatUnits(BigNumber.from(stakedValuesRaw[Token.O])))];

      console.log('tokenValuesRaw: ' + tokenValuesRaw);
      console.log('tokenValues: ' + tokenValues);
      console.log('stakedValuesRaw: ' + stakedValuesRaw);
      console.log('stakedValues: ' + stakedValues);

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
        creation:  Number(eventData['startTime']) - this.depositPeriod,
        deposit_period_end:  (Number(eventData['startTime'])),
        completion: eventData['endTime'],
        status: this.parseEventStatus(eventData, tokenValuesRaw),
        staked_values: stakedValues,
        staked_values_raw: stakedValuesRaw,
        token_values: tokenValues,
        token_values_raw: tokenValuesRaw,
        ratio: parseFloat(ethers.utils.formatUnits(eventData['amountPerWinningToken']).toString()).toFixed(2) + '%'
      };

      if (eventId in this.events) {
        this.eventsStore.upsert(eventId, eventEntry);
      }else {
        console.log('adding new eventId ' + eventId);
        this.eventsStore.add(eventEntry, { prepend: true })
        // set timeout for deposit_period_end if it hasn't happened yet
        if (eventEntry.status === Status.Staking) {
          console.log('adding timeout for eventId ' + eventId);
          console.log('Date.now(): ' + Date.now());
          console.log('StartTime: ' + (Number(eventData['startTime'])) * 1000);
          const timeUntilDepositEnd = ((Number(eventData['startTime']) * 1000) -  Date.now());
          console.log('timeUntilDepositEnd: ' + timeUntilDepositEnd);
          this.updateStatusFollowingDepositPeriod(timeUntilDepositEnd, eventId);
        }
      }

      this.events[eventId] = eventEntry;
      console.log('events length after push: ' + Object.keys(this.events).length);
    }

    async setupContractAddresses(signer, address) {
      if (kovan) {
        contractAddresses['ContractProxy'] = '0x328eC87d3AE746169DF56089ED96DEa8e34453B1';
        contracts['ContractProxy']          = new ethers.Contract(contractAddresses['ContractProxy'], ContractProxy.abi, signer);
        // contractAddresses['OPUSD']          = await contracts['ContractProxy'].getOPUSDAddress();
        // contractAddresses['ChainLink']      = await contracts['ContractProxy'].getChainLinkAddress();
        // contractAddresses['Utils']          = await contracts['ContractProxy'].getUtilsAddress();
        // contractAddresses['Oracle']         = await contracts['ContractProxy'].getOracleAddress();
        // contractAddresses['TrustPredict']   = await contracts['ContractProxy'].getTrustPredictAddress();
        // contractAddresses['OPEventFactory'] = await contracts['ContractProxy'].getOPEventFactoryAddress();
        contractAddresses['OPUSD']          = '0xb876a52abd933a02426c31d8231e9b9352864214';
        contractAddresses['ChainLink']      = '0xa36085f69e2889c224210f603d836748e7dc0088';
        contractAddresses['Utils']          = '0x90B66e6b61abfFD8429d3d0a44082D3fD712EA11';
        contractAddresses['Oracle']         = '0x892Ef27cC1B1A46646CB064f8d12EE66F74BEFc7';
        contractAddresses['TrustPredict']   = '0xc79639B08546B516509c48C95AefE3Eb9B160006';
        contractAddresses['OPEventFactory'] = '0x6668a16b854651653F62038DE61b309dBC1c6543';

        Object.keys(contractAddresses).forEach((key) => {
          console.log(key + ' address: ' + contractAddresses[key]);
      })
      } else {
        let nonce = 0;
        contractAddresses['ContractProxy']  = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['OPUSD']          = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['ChainLink']      = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['Utils']          = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['Oracle']         = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['TrustPredict']   = this.crypto.getNextContractAddress(address, nonce++);
        contractAddresses['OPEventFactory'] = this.crypto.getNextContractAddress(address, nonce++);
      }
    }

    async setupEventSubscriber(){
      // OPEventFactory initial data gathering
      const _USER: any  = this.authQuery.getValue();
      const signer: any = _USER.signer;

      this.address = await signer.getAddress();
      console.log('signer address: ' + this.address);

      await this.setupContractAddresses(signer, this.address);

      contracts['OPEventFactory'] = new ethers.Contract(contractAddresses['OPEventFactory'], OPEventFactory.abi, signer);
      contracts['TrustPredict'] = new ethers.Contract(contractAddresses['TrustPredict'], TrustPredictToken.abi, signer);

      this.crypto.provider().resetEventsBlock(0);
      this.balanceService.setupBalanceSubscriber(contracts['TrustPredict'], this.address);

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

      const _USER: any       = this.authQuery.getValue();
      const _wallet: any = _USER.wallet;
      const _signer: any = _USER.signer;

      if (!_wallet || !_signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      console.log(Math.ceil(rawBetPrice * 100).toString());
      const betPrice        = ethers.utils.parseUnits(Math.ceil(rawBetPrice  *              100).toString(), priceFeedDecimals - 2);
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

        const waitForApprovals = Promise.all([approveCL, approveOP]);
        waitForApprovals.then( async (res) => {
          const approveCLWait = await res[0].wait();
          const approveOPWait = await res[1].wait();
          if (approveCLWait.status === 1 && approveOPWait.status === 1) {
            console.log(`Deploying event with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
            const createOPEvent =  contracts['OPEventFactory'].createOPEvent(betPrice,
                                                            Number(betSide),
                                                            eventPeriod,
                                                            numTokensToMint,
                                                            pairContract );

            const waitForCreation = Promise.all([createOPEvent]);
            waitForCreation.then( async (res) => {
              const createOPEventWait = await res[0].wait();
              if (createOPEventWait.status === 1) {
                resolve(true);
              }
            }).catch( err =>
              reject(
                `Error during transaction creation: ${JSON.stringify(err)}`
              )
            );
            
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

            const _USER: any       = this.authQuery.getValue();
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

              const waitForApproval = Promise.all([approveOP]);
              waitForApproval.then( async (res) => {
                const approveOPWait = await res[0].wait();
                if (approveOPWait.status === 1) {
                  console.log(`Placing stake with | eventId: ${eventId}| numTokensToMint: ${numTokensToMint} || selection: ${selection}`);
                  const stakeOP = contracts['OPEventFactory'].stake(eventId, numTokensToMint, selection);
                  const waitForStake = Promise.all([stakeOP]);
                  waitForStake.then( async (res) => {
                    const stakeOPWait = await res[0].wait();
                    if (stakeOPWait.status === 1) {
                      resolve(true);
                    }
                  }).catch( err =>
                    reject(
                      `Error during transaction creation: ${JSON.stringify(err)}`
                    )
                  );

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

      const _USER: any       = this.authQuery.getValue();
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

        const waitForApproval = Promise.all([approveTP]);
        waitForApproval.then( async (res) => {
          const approveTPWait = await res[0].wait();
          if (approveTPWait.status === 1) {

            const revokeOP = contracts['OPEventFactory'].revoke(eventId);
            const waitForRevoke = Promise.all([revokeOP]);
            waitForRevoke.then( async (res) => {
              const revokeOPWait = await res[0].wait();
              if (revokeOPWait.status === 1) {
                resolve(true);
              }
            }).catch( err =>
              reject(
                `Error during transaction creation: ${JSON.stringify(err)}`
              )
            );

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

      const _USER: any       = this.authQuery.getValue();
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

            const claimOP = contracts['OPEventFactory'].claim(eventId);
            const waitForClaim = Promise.all([claimOP]);
            waitForClaim.then( async (res) => {
              const claimOPWait = await res[0].wait();
              if (claimOPWait.status === 1) {
                resolve(true);
              }
            }).catch( err =>
              reject(
                `Error during transaction creation: ${JSON.stringify(err)}`
              )
            );


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

      const _USER: any       = this.authQuery.getValue();
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

  getTotalValue(value) {
    return value[0] + value[1];
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
