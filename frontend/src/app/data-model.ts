import { ID } from '@datorama/akita';
import { BigNumber, ethers } from 'ethers';

export enum Token {
  No = 0,
  Yes = 1
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
  id?: ID; // eventId
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
  staked_values: number[];
  staked_values_raw: BigNumber[];
  token_values: number[];
  token_values_raw: BigNumber[];
  status?: Status;
  ratio?: string;
}


export interface IStakingBalance {
  id?: ID; // wallet
  balance?: BigNumber;
}

export interface ITokenBalance {
  id?: ID; // sha256(eventId + wallet)
  YesToken?: BigNumber;
  NoToken?: BigNumber;
}
