import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { OptionService } from '@services/option-service/option.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';

import { ethers } from 'ethers';
const BigNumber = ethers.BigNumber;

import { map, mapTo, timeout } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';
import { ToastrService } from 'ngx-toastr';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { EventsStore, EventFactoryStore } from './op-event.service.store';
import { IEvent, Status, Position, Side, Token, IEventFactory } from '@app/data-model';

@Injectable({
  providedIn: 'root'
})
export class OpEventService {

  events = {} as IEvent;
  eventFactory = {} as IEventFactory;

  address = '';
  
  
  constructor(
    private crypto: CryptoService,
    private optionService: OptionService,
    private eventsStore: EventsStore,
    private cryptoService: CryptoService,
    private eventFactoryStore: EventFactoryStore,
    private toastr: ToastrService,
    @Inject(WEB3) private web3: Web3) {}

    async setupSubscribers(){
      await this.setupInitSubscriber();
      await this.setupEventSubscriber();

    }

    async setupInitSubscriber(){
      // OPEventFactory Initialize subscriber
      //this.crypto.provider().resetEventsBlock(0);
      this.crypto.provider().on( {
          address: this.optionService.contracts['OPEventFactory'].address,
          topics: [ethers.utils.id('Initialize(uint256,uint256,uint256,uint256,uint256)')], // OPEventFactory
        }, async (log) => {
          if(Object.keys(this.eventFactory).length === 0){
            const init = this.optionService.abis['OPEventFactory'].parseLog(log);

            console.log('init..' + JSON.stringify(init));

            console.log('setting eventfactory..');
            const maxEventPeriod             = init['args'][0];
            const minimumTokenAmountPerEvent = init['args'][1];
            const maxPredictionFactor        = init['args'][2];
            const depositPeriod              = init['args'][3];
            const valuePerToken              = init['args'][4];
            const assetSymbol = this.cryptoService.contractData['Asset'].symbol;
            const assetDecimals = this.cryptoService.contractData['Asset'].decimals;

            const eventFactoryEntry = {
              id: 0,
              max_event_period: maxEventPeriod,
              minimum_token_amount_per_event: minimumTokenAmountPerEvent,
              max_prediction_factor: maxPredictionFactor,
              deposit_period: depositPeriod,
              value_per_token: valuePerToken,
              asset_symbol: assetSymbol,
              asset_decimals: parseFloat(assetDecimals.toString()),
            };

            console.log('eventFactoryEntry: ' + JSON.stringify(eventFactoryEntry));

            this.eventFactory[0] = eventFactoryEntry;
            this.eventFactoryStore.upsert(0, eventFactoryEntry);
          }
        });
    }

    async setupEventSubscriber(){
      // OPEventFactory subscriber
      this.crypto.provider().on( {
          address: this.optionService.contracts['OPEventFactory'].address,
          topics: [ethers.utils.id('EventUpdate(address)')], // OPEventFactory
        }, async (eventIdRaw) => {
          const eventID = '0x' + eventIdRaw.data.substring(26);
          //console.log('eventID subscriber: ' + eventID);
          //console.log('events length: ' + Object.keys(this.events).length);
          const eventData = await this.optionService.contracts['OPEventFactory'].events(eventID);
          const balances = await this.optionService.contracts['TrustPredict'].getTokenBalances(eventID);
          await this.parseEventData(eventID, eventData, balances);
        });
    }

    updateStatusFollowingDepositPeriod(depositPeriodEnd, eventId) {
      // set a timer to update the status following depositPeriodEnd.
      setTimeout(() => {
          //console.log('ending timeout for eventId ' + eventId);
          const eventEntry = this.events[eventId];
          // call status update function, upsert result
          const totalTokenValue = eventEntry.token_values_raw[0].add(eventEntry.token_values_raw[1]);

          const minimumTokenAmountPerEvent = this.eventFactory[0].minimum_token_amount_per_event;

          //console.log('ending timeout for eventId ' + eventId);
          //console.log('totalTokenValue ' + totalTokenValue);
          //console.log('this.minimumTokenAmountPerEvent ' + this.minimumTokenAmountPerEvent);
          const isDepositPeriod = (new Date() < new Date(this.timestampToDate(eventEntry.deposit_period_end)));
          const status =   isDepositPeriod                                                      ? Status.Staking :
                           eventEntry.Status === Status.Settled                                 ? Status.Settled :
                           !isDepositPeriod && (totalTokenValue.lt(minimumTokenAmountPerEvent)) ? Status.Expired :
                                                                                                  Status.Active;

          //console.log('new status: ' + status);

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
      const minimumTokenAmountPerEvent = this.eventFactory[0].minimum_token_amount_per_event;
      const isDepositPeriod = (new Date() < new Date(this.timestampToDate(Number(eventData['startTime']))));
      let status = isDepositPeriod                                                    ? Status.Staking :
                   (eventData['eventSettled'] === true)                               ? Status.Settled :
                   !isDepositPeriod && totalTokenValue.lt(minimumTokenAmountPerEvent) ? Status.Expired :
                                                                                        Status.Active;
      // handle the case where the event is not yet settled but ready to be.

      const readyToSettle = (status == Status.Active) && (new Date() >= new Date(this.timestampToDate(Number(eventData['endTime']))));
      if(readyToSettle) status = Status.Settled;

      return status;
    }

    async parseEventData(eventId, eventData, tokenValuesRaw){
      while(Object.keys(this.eventFactory).length === 0){
         console.log('undefined');
         await timeout(2);
       }
      console.log('this.eventFactory: ' + JSON.stringify(this.eventFactory));
      const pairing = this.optionService.availablePairs[eventData['priceAggregator']];
      //console.log('pairing: ' + pairing);

      const ticker = pairing.pair.replace('/USD', '');
      const asset = this.optionService.availableAssets[ticker];
      const valuePerToken = this.eventFactory[0].value_per_token;

      const tokenValues = [parseFloat(ethers.utils.formatUnits(BigNumber.from(tokenValuesRaw[Token.No]))),
                           parseFloat(ethers.utils.formatUnits(BigNumber.from(tokenValuesRaw[Token.Yes])))];

      const stakedValuesRaw = [tokenValuesRaw[ Token.No].mul(valuePerToken).div(ethers.constants.WeiPerEther),
                               tokenValuesRaw[Token.Yes].mul(valuePerToken).div(ethers.constants.WeiPerEther)];

      const stakedValues = [parseFloat(ethers.utils.formatUnits(BigNumber.from(stakedValuesRaw[Token.No]))),
                           parseFloat(ethers.utils.formatUnits(BigNumber.from(stakedValuesRaw[Token.Yes])))];

      // console.log('tokenValuesRaw: ' + tokenValuesRaw);
      // console.log('tokenValues: ' + tokenValues);
      // console.log('stakedValuesRaw: ' + stakedValuesRaw);
      // console.log('stakedValues: ' + stakedValues);

      //console.log('startTime: ' + Number(eventData['startTime']));

      const eventEntry = {
        id: eventId,
        asset_name: asset.name,
        asset_ticker: ticker,
        asset_icon: asset.icon,
        side: Number(eventData['betSide']),
        creator: eventData['creator'],
        condition_price: ethers.utils.formatUnits(eventData['betPrice'].valueOf().toString(), 8).toString(),
        settled_price: parseFloat(ethers.utils.formatUnits(eventData['settledPrice'].valueOf().toString(), 8).toString()).toFixed(2),
        winner: Number(eventData['winner']),
        creation:  Number(eventData['startTime']) - this.optionService.depositPeriod,
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
        //console.log('adding new eventId ' + eventId);
        this.eventsStore.add(eventEntry, { prepend: true })
        // set timeout for deposit_period_end if it hasn't happened yet
        if (eventEntry.status === Status.Staking) {
          //console.log('adding timeout for eventId ' + eventId);
          //console.log('Date.now(): ' + Date.now());
          //console.log('StartTime: ' + (Number(eventData['startTime'])) * 1000);
          const timeUntilDepositEnd = ((Number(eventData['startTime']) * 1000) -  Date.now());
          //console.log('timeUntilDepositEnd: ' + timeUntilDepositEnd);
          this.updateStatusFollowingDepositPeriod(timeUntilDepositEnd, eventId);
        }
      }

      this.events[eventId] = eventEntry;
      //console.log('events length after push: ' + Object.keys(this.events).length);
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

      if (!this.optionService.address || !this.optionService.signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      console.log(Math.ceil(rawBetPrice * 100).toString());
      const betPrice        = ethers.utils.parseUnits(Math.ceil(rawBetPrice  * 100).toString(), this.optionService.priceFeedDecimals - 2);
      const numTokensToMint = ethers.utils.parseUnits(numTokensStakedToMint.toString()).div(this.optionService.AssetOptionRatio).toString();
      console.log(numTokensToMint);

      try {
        const optionsOP = {};
        let allowance = await this.optionService.contracts['Asset'].allowance(this.optionService.address, this.optionService.contracts['OPEventFactory'].address);
        allowance = ethers.BigNumber.from(allowance);
        console.log('allowance: ' + allowance);
        if(allowance.gte(numTokensToMint)){
          console.log(`Deploying event with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
          const createOPEvent = this.optionService.contracts['OPEventFactory'].createOPEvent(betPrice,
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
          }).catch( err => {
            this.showError(err);
            resolve(false);
          });
        } else {
          const optionsOP = {};
          const approveOP = this.optionService.contracts['Asset'].approve(this.crypto.contractAddresses['OPEventFactory'],
                                                    ethers.constants.MaxUint256,
                                                    optionsOP );

          const waitForApprovals = Promise.all([approveOP]);
          waitForApprovals.then( async (res) => {
            const approveOPWait = await res[0].wait();
            if (approveOPWait.status === 1) {
              console.log(`Deploying event with =>> betPrice: ${betPrice} | betSide: ${Number(betSide)} | eventPeriod: ${eventPeriod} | numTokensToMint: ${numTokensToMint} || pairContract: ${pairContract} `);
              const createOPEvent = this.optionService.contracts['OPEventFactory'].createOPEvent(betPrice,
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
              }).catch( err => {
                this.showError(err);
                resolve(false);
              });
            }
          }).catch( err => {
            this.showError(err);
            resolve(false);
          });
        }
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

            if (!this.optionService.address || !this.optionService.signer) {
              reject(
                new Error(`Please log in via Metamask!`)
              );
            }

            const numTokensToMint = ethers.utils.parseUnits(numTokensStakedToMint.toString()).div(this.optionService.AssetOptionRatio).toString();
            console.log(numTokensToMint);
            try {


              const optionsOP = {};
              let allowance = await this.optionService.contracts['Asset'].allowance(this.optionService.address, this.optionService.contracts['OPEventFactory'].address);
              allowance = ethers.BigNumber.from(allowance);
              console.log('allowance: ' + allowance);
              if(allowance.gte(numTokensToMint)){
                console.log(`Placing stake with | eventId: ${eventId}| numTokensToMint: ${numTokensToMint} || selection: ${selection}`);
                const stakeOP = this.optionService.contracts['OPEventFactory'].stake(eventId, numTokensToMint, selection);
                const waitForStake = Promise.all([stakeOP]);
                waitForStake.then( async (res) => {
                  const stakeOPWait = await res[0].wait();
                  if (stakeOPWait.status === 1) {
                    resolve(true);
                  }
                }).catch( err => {
                  this.showError(err);
                  resolve(false);
                });
              } else {
                const optionsOP = {};
                const approveOP = this.optionService.contracts['Asset'].approve(this.crypto.contractAddresses['OPEventFactory'],
                                                                                ethers.constants.MaxUint256,
                                                                                optionsOP );

                const waitForApproval = Promise.all([approveOP]);
                waitForApproval.then( async (res) => {
                  const approveOPWait = await res[0].wait();
                  if (approveOPWait.status === 1) {
                    console.log(`Placing stake with | eventId: ${eventId}| numTokensToMint: ${numTokensToMint} || selection: ${selection}`);
                    const stakeOP = this.optionService.contracts['OPEventFactory'].stake(eventId, numTokensToMint, selection);
                    const waitForStake = Promise.all([stakeOP]);
                    waitForStake.then( async (res) => {
                      const stakeOPWait = await res[0].wait();
                      if (stakeOPWait.status === 1) {
                        resolve(true);
                      }
                    }).catch( err => {
                      this.showError(err);
                      resolve(false);
                    });
                  }
                }).catch( err => {
                  this.showError(err);
                  resolve(false);
                });
              }
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

      if (!this.optionService.signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      try {
        const revokeOP = this.optionService.contracts['OPEventFactory'].revoke(eventId);
        const waitForRevoke = Promise.all([revokeOP]);
        waitForRevoke.then( async (res) => {
          const revokeOPWait = await res[0].wait();
          if (revokeOPWait.status === 1) {
            resolve(true);
          }
        }).catch( err => {
          this.showError(err);
          resolve(false);
        });
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

      if (!this.optionService.signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      try {

            const claimOP = this.optionService.contracts['OPEventFactory'].claim(eventId);
            const waitForClaim = Promise.all([claimOP]);
            waitForClaim.then( async (res) => {
              const claimOPWait = await res[0].wait();
              if (claimOPWait.status === 1) {
                resolve(true);
              }
            }).catch( err => {
              this.showError(err);
              resolve(false);
            });
      }
      catch (error) {
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

      // parse values for contract call
      const from = this.optionService.address;
      const amountEncoded = ethers.utils.parseUnits(amount.toString());

      // log
      console.log('eventId: ' + eventId);
      console.log('from: ' + from.address);
      console.log('to: ' + to);
      console.log('amountEncoded: ' + amountEncoded.toString());
      console.log('selection: ' + selection);

      if (!this.optionService.signer) {
        reject(
          new Error(`Please log in via Metamask!`)
        );
      }

      try {
        const optionsTP = {};
        const transferTP = this.optionService.contracts['TrustPredict'].transferFrom(
          eventId, from, to, amountEncoded, selection, optionsTP
        );
        const waitForInteractions = Promise.all([transferTP]);
        waitForInteractions.then( async (res) => {
          const transferTPWait = await res[0].wait();
          if (transferTPWait.status === 1) {
            resolve(true);
          }
        }).catch( err => {
          this.showError(err);
          resolve(false);
        });
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
    // if LHS and Higher, or RHS and Lower, return Yes. else No.
    return ((position === Position.Left && betSide === Side.Higher) ||
            (position !== Position.Left && betSide !== Side.Higher)) ?
            'Yes' :
            'No';
  }

  parseTokenAmount(amount) {
    return ethers.utils.formatUnits(amount).toString();
  }

  // following float conversion we need to add the leading zero to the string.
  currencyFormat(amount: string) {
    return (amount.indexOf('.') >= 0 && amount.length - 1 === amount.indexOf('.') + 1) ?
            (amount + '0') :
            amount;
  }

  getSymbol() {
    return this.eventFactory[0].asset_symbol;
  }

  getDecimals() {
    return this.eventFactory[0].asset_decimals;
  }

  getTotalValue(value) {
    return parseFloat((value[0] + value[1]).toString()).toFixed(2);
  }

  /**
   * Return text depending on if the condition is true/false
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

  showError(e) {
    if(e.message=="Internal JSON-RPC error."){
      return this.toastr.error("Error during transaction creation: " + e.data.message.split(':')[2]);
    }else {
      return this.toastr.error(e.message.split(':')[1]);
    }
  }
}
