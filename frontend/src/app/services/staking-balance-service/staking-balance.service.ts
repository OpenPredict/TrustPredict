import { Injectable, Inject } from '@angular/core';
import { CryptoService } from '@services/crypto-service/crypto.service';
import { OptionService } from '@services/option-service/option.service';
import { AuthQuery } from '@services/auth-service/auth.service.query';

import { ethers } from 'ethers';
const BigNumber = ethers.BigNumber;

import { map, mapTo } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { BehaviorSubject, Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';


import { WEB3 } from '@app/web3';
import Web3 from 'web3';
import { StakingBalancesStore } from './staking-balance.service.store';
import { IStakingBalance } from '@app/data-model';

@Injectable({
  providedIn: 'root'
})
export class StakingBalanceService {

  balance = {} as IStakingBalance;

  balanceUpdates = {}; // stores Ids of new deposit events, to prevent the same event affecting state.

  private _currentBalance = new BehaviorSubject<any>({});
  $currentBalance: Observable<Readonly<any>> = this._currentBalance.asObservable();
  constructor(
    private crypto: CryptoService,
    private authQuery: AuthQuery,
    private optionService: OptionService,
    private balanceStore: StakingBalancesStore,
    @Inject(WEB3) private web3: Web3) {}

    async setupSubscriber(){

      const _balance = await this.optionService.contracts['Asset'].balanceOf(this.optionService.address);

      this.balance[this.optionService.address] = {
        id: this.optionService.address,
        balance: _balance,
      };
      this.balanceStore.upsert(this.optionService.address, this.balance[this.optionService.address]);

      this.crypto.provider().on( {
          address: this.optionService.contracts['Asset'].address,
          topics: [ethers.utils.id('Transfer(address,address,uint256)')],
        }, async (log) => {
          //console.log('staking-balance log:' + log);
          const from = ethers.utils.getAddress('0x' + log['topics'][1].substring(26));
          const to   = ethers.utils.getAddress('0x' + log['topics'][2].substring(26));

          //console.log('from: ' + from);
          //console.log('to: ' + to);

          // Check wallet balance change
          if (from === this.optionService.address || to === this.optionService.address) {

            //console.log('amount: ' + amount);
            // Unique identifier for log
            const id = log['transactionHash'].concat(log['logIndex']);
            //console.log('id: ' + id);
            let currentBalance = this.balance[this.optionService.address].balance;

            if (!(id in this.balanceUpdates)){
              this.balanceUpdates[id] = true;

              const _balance = await this.optionService.contracts['Asset'].balanceOf(this.optionService.address);

              this.balance[this.optionService.address] = {
                id: this.optionService.address,
                balance: _balance,
              };
              this.balanceStore.upsert(this.optionService.address, this.balance[this.optionService.address]);
              //console.log('wallet balance: ' + currentBalance.valueOf().toString());
            }
          }
        });
    }

  format(balances) {
      // console.log('balances: ' + balances);
      const balanceYes  = Number(ethers.utils.formatUnits(balances.YesToken.toString()).toString());
      const balanceNo = Number(ethers.utils.formatUnits(balances.NoToken.toString()).toString());
      // console.log('balanceYes encoded: ' + balanceYes);
      // console.log('balanceNo encoded: ' + balanceNo);

      return {
        NoToken: balanceNo,
        YesToken: balanceYes
      };
  }

  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(Object.values(this.balance)),
      map(response => this.balanceStore.set(response))
    );

    return cacheable(this.balanceStore, request);
  }



  getBalance(id: ID) {
    return timer(500).pipe(
      mapTo(Object.values(this.balance)),
      map(() => this.balanceStore.add(this.balance[id]))
    );
  }
}
