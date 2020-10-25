import { ID } from '@datorama/akita';
import { BigNumber, ethers } from 'ethers';

export enum Token {
  IO = 0,
  O = 1
}
export enum Side {
  Lower = 0,
  Higher = 1
}
export enum Position {
  Right = 0,
  Left = 1
}
export enum Status {
  Staking = 0,
  Expired = 1,
  Active  = 2,
  Settled = 3
}

export interface IOptionsPriceWager {
    id?: ID;
    pair?: string; // name
    pair_contract?: string;
    condition?: boolean; // true is ++ / false is --
    condition_price?: number; // the price the user has set as the base point for the previous condition
    expiration_date?: number; // seconds
    option_asset?: string; // contract address ? or name
    option_stake?: number; // amount of the asset being staked in the wager
    tnc?: boolean; // user must agree before option can be placed.
    option_link?: string; // find out what this is ?
}

export interface LedgerWallet {
    publicKey: string;
    address: string;
}


export interface IEvent {
  id?: ID;
  asset_name?: string;
  asset_ticker?: string;
  asset_icon?: string;
  side?: Side;
  creator?: string;
  condition_price?: string | number; // whatever the contract returns
  settled_price?: string | number; // whatever the contract returns
  winner?: Token;
  creation?: number;
  deposit_period_end?: number;
  completion?: number;
  value?: number[];
  status?: Status;
  ratio?: string;
}


export interface IBalance {
  OToken?: BigNumber;
  IOToken?: BigNumber;
}
