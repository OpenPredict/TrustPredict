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
import { BalancesStore } from './op-balance.service.store';
import { IBalance, Status, Position, Side, Token } from '@app/data-model';

@Injectable({
  providedIn: 'root'
})
export class OpBalanceService {

  balances = {} as IBalance;

  updates = {};

  private _currentBalance = new BehaviorSubject<any>({});
  $currentBalance: Observable<Readonly<any>> = this._currentBalance.asObservable();
  constructor(
    private crypto: CryptoService,
    private authQuery: AuthQuery,
    private optService: OptionService,
    private balancesStore: BalancesStore,
    @Inject(WEB3) private web3: Web3) {}

    async setupBalanceSubscriber(trustPredict, walletAddress){

      const abi = new ethers.utils.Interface([
        'event BalanceChange(uint256,address,address,address,uint256,uint8)'
      ]);

      console.log('trustPredict address: ' + trustPredict.address);
      console.log('wallet address: ' + walletAddress);

      this.crypto.provider().resetEventsBlock(0);
      this.crypto.provider().on( {
          address: trustPredict.address,
          topics: [
              ethers.utils.id('BalanceChange(uint256,address,address,address,uint256,uint8)'),
            ],
        }, async (log) => {
          const events = abi.parseLog(log);
          console.log(events);
          const id = events['args'][0];
          const from = events['args'][2];
          const   to = events['args'][3];
          console.log('id: ' + from);
          console.log('from: ' + from);
          console.log('to: ' + to);
          console.log('walletAddress: ' + walletAddress);
          if (from === walletAddress || to === walletAddress) {
            // eventId is used as ID type in IEvent, which stores in lower case.
            const eventId = events['args'][1].toLowerCase();
            const amount = ethers.BigNumber.from(events['args'][4]);
            const selection = events['args'][5];

            console.log('eventId: ' + eventId);
            console.log('amount: ' + amount);
            console.log('selection: ' + selection);
            // If this is the first call just get balances from the chain. otherwise update from log.
            let balanceEntry: IBalance = {};
            if (!(eventId in this.balances)) {
              // get initial balances
              balanceEntry.id = eventId;
              balanceEntry.IOToken = BigNumber.from(0);
              balanceEntry.OToken = BigNumber.from(0);
              this.balances[eventId] = balanceEntry;
            } else {
              balanceEntry = this.balances[eventId];
            }

            if (!(id in this.updates)){
              this.updates[id] = true;
              // We can't assign to values in the state directly (ie. this.balances), so pull out the values and reassign a
              // new object after.
              let OTokenValue  = this.balances[eventId].OToken;
              let IOTokenValue = this.balances[eventId].IOToken;

              if (to === walletAddress) {
                console.log('Balance add - to wallet address from: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? IOTokenValue = IOTokenValue.add(amount)
                                  :  OTokenValue = OTokenValue.add(amount);
              }
              if (from === walletAddress) {
                console.log('Balance sub - from wallet address to: ' + to + ' selection: ' + selection.valueOf().toString());
                (selection === 0) ? IOTokenValue = IOTokenValue.sub(amount)
                                  :  OTokenValue = OTokenValue.sub(amount);
              }

              balanceEntry = {
                id: this.balances[eventId].id,
                OToken: OTokenValue,
                IOToken: IOTokenValue,
              };

              this.balances[eventId] = balanceEntry;
              this._currentBalance.next(this.balances);
              this.balancesStore.upsert(eventId, balanceEntry);
              console.log('balances: ' + JSON.stringify(this.balances[eventId]));
            }
          }
        });
    }

  getById(eventId) {
    const balanceO  = (this.balances[eventId] !== undefined)
                    ? Number(ethers.utils.formatUnits(this.balances[eventId].OToken.toString()).toString())
                    : 0;

    const balanceIO = (this.balances[eventId] !== undefined)
                    ? Number(ethers.utils.formatUnits(this.balances[eventId].IOToken.toString()).toString())
                    : 0;

    console.log('balanceO encoded: ' + balanceO);
    console.log('balanceIO encoded: ' + balanceIO);

    return {
      IOToken: balanceIO,
      OToken: balanceO
    };
  }

  format(balances) {
      // console.log('balances: ' + balances);
      const balanceO  = Number(ethers.utils.formatUnits(balances.OToken.toString()).toString());
      const balanceIO = Number(ethers.utils.formatUnits(balances.IOToken.toString()).toString());
      // console.log('balanceO encoded: ' + balanceO);
      // console.log('balanceIO encoded: ' + balanceIO);

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



  getBalance(id: ID) {
    return timer(500).pipe(
      mapTo(Object.values(this.balances)),
      map(() => this.balancesStore.add(this.balances[id]))
    );
  }
}
