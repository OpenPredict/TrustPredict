import { ID } from '@datorama/akita';

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
    condition?: boolean;
    condition_price?: number | string; // whatever the contract returns
    completion?: string | Date;
    created?: string;
    value?: string;
    event_status?: IEventStatus;
  }

export interface IEventStatus {
    status_desc?: string;
    status_value?: string;
    status_ratio?: string;
  }
