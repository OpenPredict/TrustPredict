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
import { OpBalancesStore } from './op-balance.service.store';
import { ITokenBalance } from '@app/data-model';

@Injectable({
  providedIn: 'root'
})
export class OpBalanceService {

  balances = {} as ITokenBalance;

  updates = {};

  private _currentBalance = new BehaviorSubject<any>({});
  $currentBalance: Observable<Readonly<any>> = this._currentBalance.asObservable();
  constructor(
    private crypto: CryptoService,
    private authQuery: AuthQuery,
    private optionService: OptionService,
    private balancesStore: OpBalancesStore,
    @Inject(WEB3) private web3: Web3) {}

    async setupSubscriber(){

      const abi = new ethers.utils.Interface([
        'event BalanceChange(address,address,address,uint256,uint8)'
      ]);
      // console.log('trustPredict address: ' + trustPredict.address);
      // console.log('wallet address: ' + walletAddress);

      this.crypto.provider().resetEventsBlock(0);
      this.crypto.provider().on( {
          address: this.optionService.contracts['TrustPredict'].address,
          topics: [
              ethers.utils.id('BalanceChange(address,address,address,uint256,uint8)'),
            ],
        }, async (log) => {
          //console.log('log: ' + JSON.stringify(log));
          const events = abi.parseLog(log);
          //console.log(events);
          const from = events['args'][1];
          const   to = events['args'][2];
          // console.log('from: ' + from);
          // console.log('to: ' + to);
          // console.log('walletAddress: ' + this.optionService.address);
          if (from === this.optionService.address || to === this.optionService.address) {
            // eventId is used as ID type in IEvent, which stores in lower case.
            const eventId = events['args'][0].toLowerCase();
            const _id = this.getID(eventId);
            const amount = ethers.BigNumber.from(events['args'][3]);
            const selection = events['args'][4];

            //console.log('eventId: ' + eventId);
            //console.log('amount: ' + amount);
            //console.log('selection: ' + selection);
            // If this is the first call just get balances from the chain. otherwise update from log.
            let balanceEntry: ITokenBalance = {};
            if (!(_id in this.balances)) {
              // get initial balances
              balanceEntry.id = _id;
              balanceEntry.IOToken = BigNumber.from(0);
              balanceEntry.OToken = BigNumber.from(0);
              this.balances[_id] = balanceEntry;
            } else {
              balanceEntry = this.balances[_id];
            }

            // Gives us a unique log identifier.
            const id = log['transactionHash'].concat(log['logIndex']);
            if (!(id in this.updates)){
              this.updates[id] = true;
              // We can't assign to values in the state directly (ie. this.balances), so pull out the values and reassign a
              // new object after.
              let OTokenValue  = this.balances[_id].OToken;
              let IOTokenValue = this.balances[_id].IOToken;

              if (to === this.optionService.address) {
                //console.log('Balance add - to wallet address from: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? IOTokenValue = IOTokenValue.add(amount)
                                  :  OTokenValue = OTokenValue.add(amount);
              }
              if (from === this.optionService.address) {
                //console.log('Balance sub - from wallet address to: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? IOTokenValue = IOTokenValue.sub(amount)
                                  :  OTokenValue = OTokenValue.sub(amount);
              }

              balanceEntry = {
                id: this.balances[_id].id,
                OToken: OTokenValue,
                IOToken: IOTokenValue,
              };

              this.balances[_id] = balanceEntry;
              this._currentBalance.next(this.balances);
              this.balancesStore.upsert(_id, balanceEntry);
              //console.log('balances: ' + JSON.stringify(this.balances[_id]));
            }
          }
        });
    }

  getById(_id: ID) {
    const balanceO  = (this.balances[_id] !== undefined)
                    ? Number(ethers.utils.formatUnits(this.balances[_id].OToken.toString()).toString())
                    : 0;

    const balanceIO = (this.balances[_id] !== undefined)
                    ? Number(ethers.utils.formatUnits(this.balances[_id].IOToken.toString()).toString())
                    : 0;

    // console.log('balanceO encoded: ' + balanceO);
    // console.log('balanceIO encoded: ' + balanceIO);

    return {
      IOToken: balanceIO,
      OToken: balanceO
    };
  }

  format(balances) {
      const balanceO  = Number(ethers.utils.formatUnits(balances.OToken.toString()).toString());
      const balanceIO = Number(ethers.utils.formatUnits(balances.IOToken.toString()).toString());

      return {
        IOToken: balanceIO,
        OToken: balanceO
      };
  }

  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(Object.values(this.balances)),
      map(response => this.balancesStore.set(response))
    );

    return cacheable(this.balancesStore, request);
  }

  setBalance(_id: ID) {
    const balanceEntry = {
      id: _id,
      OToken: ethers.BigNumber.from('0'),
      IOToken: ethers.BigNumber.from('0'),
    };

    this.balances[_id] = balanceEntry;
    this._currentBalance.next(this.balances);
    this.balancesStore.upsert(_id, balanceEntry);
  }



  getBalance(id: ID) {
    return timer(500).pipe(
      mapTo(Object.values(this.balances)),
      map(() => this.balancesStore.add(this.balances[id]))
    );
  }

  getID(eventId: string) {
    //return ethers.utils.keccak256('0x' + '0'.repeat(16) + eventId.substring(2) + this.optionService.address.substring(2));
    return ethers.utils.keccak256(eventId + this.optionService.address.substring(2));
  }

  getMaxStake(balances, selectionID) {
    const balancesFormatted = this.format(balances);
    const total = balancesFormatted.OToken + balancesFormatted.IOToken;
    const selection = (selectionID === 'O') ? balancesFormatted.OToken : balancesFormatted.IOToken;

    // get 10% of pot
    const maxStake = total / 10;
    // - get max of selection
    let maxSelection = (selection - (total * 0.9)) * -10;
    if (maxSelection < 0) { maxSelection = 0; }

    // - return whatever is lower (bounded by zero).
    return (maxSelection < maxStake) ? maxSelection : maxStake;
  }
}
