import { Injectable } from '@angular/core';
import { OptionsStore } from './option.service.store';
import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';

export const options: any[] = [];

const ContractProxy     = require('@truffle/build/contracts/ContractProxy.json');
const OPUSD             = require('@truffle/build/contracts/OPUSDToken.json');
const ChainLink         = require('@truffle/build/contracts/ChainLinkToken.json');
const Utils             = require('@truffle/build/contracts/Utils.json');
const Oracle            = require('@truffle/build/contracts/Oracle.json');
const TrustPredictToken = require('@truffle/build/contracts/TrustPredictToken.json');
const OPEventFactory    = require('@truffle/build/contracts/OPEventFactory.json');

const kovan = false;

@Injectable({
  providedIn: 'root'
})
export class OptionService {

  address: any;
  signer: any;
  contracts: any = {};
  OPUSDOptionRatio = 100;
  priceFeedDecimals = 8;

  contractAddresses: any = {
    'ContractProxy'  : (kovan) ? '0x328eC87d3AE746169DF56089ED96DEa8e34453B1' : '0xBf610614CaA08d9fe7a4F61082cc32951e547a91',
    'OPUSD'          : (kovan) ? '0xb876a52abd933a02426c31d8231e9b9352864214' : '0x4C6f9E62b4EDB743608757D9D5F16B0B67B41285',
    'ChainLink'      : (kovan) ? '0xa36085f69e2889c224210f603d836748e7dc0088' : '0x6c6387F01EddCd8fEcb674332D22d665c5313a90',
    'Utils'          : (kovan) ? '0x90B66e6b61abfFD8429d3d0a44082D3fD712EA11' : '0xc6ACe392cE166D3f2013302d751Bfc26C166048e',
    'Oracle'         : (kovan) ? '0x892Ef27cC1B1A46646CB064f8d12EE66F74BEFc7' : '0x30690193C75199fdcBb7F588eF3F966402249315',
    'TrustPredict'   : (kovan) ? '0xb1D9A08BA7d5184829Fa7f84A839Ec98607415dE' : '0x7B03b5F3D2E69Bdbd5ACc5cd0fffaB6c2A64557C',
    'OPEventFactory' : (kovan) ? '0x6668a16b854651653F62038DE61b309dBC1c6543' : '0x4eb24Db3F49F82A475281d49D3d327f623B6e3dA',
  };

  availableAssets: any = {
    'AUD':   { name: 'Australian Dollar',     icon: '/assets/img/aud.svg',   ticker: 'AUD',   selected: false },
    'BAT':   { name: 'Basic Attention Token', icon: '/assets/img/bat.svg',   ticker: 'BAT',   selected: false },
    'BNB':   { name: 'Binance Coin',          icon: '/assets/img/bnb.svg',   ticker: 'BNB',   selected: false },
    'BTC':   { name: 'Bitcoin',               icon: '/assets/img/btc.svg',   ticker: 'BTC',   selected: false },
    'CDAI':  { name: 'Compound Dai',          icon: '/assets/img/cdai.svg',  ticker: 'CDAI',  selected: false },
    'CHF':   { name: 'Swiss Franc',           icon: '/assets/img/chf.svg',   ticker: 'CHF',   selected: false },
    'DAI':   { name: 'Dai',                   icon: '/assets/img/dai.svg',   ticker: 'DAI',   selected: false },
    'ETH':   { name: 'Ethereum',              icon: '/assets/img/eth.svg',   ticker: 'ETH',   selected: false },
    'EUR':   { name: 'Euro',                  icon: '/assets/img/eur.svg',   ticker: 'EUR',   selected: false },
    'GBP':   { name: 'Pound Sterling',        icon: '/assets/img/gbp.svg',   ticker: 'GBP',   selected: false },
    'JPY':   { name: 'Japanese Yen',          icon: '/assets/img/jpy.svg',   ticker: 'JPY',   selected: false },
    'LEND':  { name: 'Aave',                  icon: '/assets/img/lend.svg',  ticker: 'LEND',  selected: false },
    'LTC':   { name: 'Litecoin',              icon: '/assets/img/ltc.svg',   ticker: 'LTC',   selected: false },
    'LINK':  { name: 'ChainLink',             icon: '/assets/img/link.svg',  ticker: 'LINK',  selected: false },
    'Oil':   { name: 'Oil',                   icon: '/assets/img/oil.svg',   ticker: 'Oil',   selected: false },
    'ORN':   { name: 'Orion Protocol',        icon: '/assets/img/orn.svg',   ticker: 'ORN',   selected: false },
    'SNX':   { name: 'Synthetix',             icon: '/assets/img/snx.svg',   ticker: 'SNX',   selected: false },
    'USDC':  { name: 'USD Coin',              icon: '/assets/img/usdc.svg',  ticker: 'USDC',  selected: false },
    'USDT':  { name: 'Tether',                icon: '/assets/img/usdt.svg',  ticker: 'USDT',  selected: false },
    'XAG':   { name: 'Silver Ounce',          icon: '/assets/img/xag.svg',   ticker: 'XAG',   selected: false },
    'XAU':   { name: 'Gold Ounce',            icon: '/assets/img/xau.svg',   ticker: 'XAU',   selected: false },
    'XRP':   { name: 'Ripple',                icon: '/assets/img/xrp.svg',   ticker: 'XRP',   selected: false },
    'XTZ':   { name: 'Tezos',                 icon: '/assets/img/xtz.svg',   ticker: 'XTZ',   selected: false },
  };

  availablePairs: {} = {
    '0x5813A90f826e16dB392abd2aF7966313fc1fd5B8': { pair: 'AUD/USD',   pair_contract:  '0x5813A90f826e16dB392abd2aF7966313fc1fd5B8' },
    '0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219': { pair: 'BAT/USD',   pair_contract:  '0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219' },
    '0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16': { pair: 'BNB/USD',   pair_contract:  '0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16' },
    '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e': { pair: 'BTC/USD',   pair_contract:  '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e' },
    '0xed0616BeF04D374969f302a34AE4A63882490A8C': { pair: 'CHF/USD',   pair_contract:  '0xed0616BeF04D374969f302a34AE4A63882490A8C' },
    '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a': { pair: 'DAI/USD',   pair_contract:  '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a' },
    '0x9326BFA02ADD2366b30bacB125260Af641031331': { pair: 'ETH/USD',   pair_contract:  '0x9326BFA02ADD2366b30bacB125260Af641031331' },
    '0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13': { pair: 'EUR/USD',   pair_contract:  '0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13' },
    '0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9': { pair: 'GBP/USD',   pair_contract:  '0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9' },
    '0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942': { pair: 'JPY/USD',   pair_contract:  '0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942' },
    '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0': { pair: 'LINK/USD',  pair_contract:  '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0' },
    '0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640': { pair: 'LTC/USD',   pair_contract:  '0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640' },
    '0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea': { pair: 'Oil/USD',   pair_contract:  '0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea' },
    '0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD': { pair: 'SNX/USD',   pair_contract:  '0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD' },
    '0x4594051c018Ac096222b5077C3351d523F93a963': { pair: 'XAG/USD',   pair_contract:  '0x4594051c018Ac096222b5077C3351d523F93a963' },
    '0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5': { pair: 'XAU/USD',   pair_contract:  '0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5' },
    '0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3': { pair: 'XRP/USD',   pair_contract:  '0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3' },
    '0xC6F39246494F25BbCb0A8018796890037Cb5980C': { pair: 'XTZ/USD',   pair_contract:  '0xC6F39246494F25BbCb0A8018796890037Cb5980C' },
    '0x70179FB2F3A0a5b7FfB36a235599De440B0922ea': { pair: 'sDEFI/USD', pair_contract:  '0x70179FB2F3A0a5b7FfB36a235599De440B0922ea' }
  };


    availableOptions: any[] = [
      { ticker: 'OPUSD', name: 'OpenPredict USD', pair_contract: '0x0bF499444525a23E7Bb61997539725cA2e928138' },
    ];

  constructor( private optionsStore: OptionsStore ) { }


  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(options),
      map(response => this.optionsStore.set(response))
    );
    return cacheable(this.optionsStore, request);
  }



}
