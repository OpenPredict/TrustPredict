import { Injectable } from '@angular/core';
import { OptionsStore } from './option.service.store';
import { map, mapTo, tap } from 'rxjs/operators';
import { ID, cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { timer } from 'rxjs/internal/observable/timer';
import { IOptionsPriceWager } from '@app/data-model';

// export const options: IOptionsPriceWager[] = [{
//   id: "1",
//   pair: "CRV:OTP",
//   balancer: "0xac6bac9dc3de2c14b420e287de8ecb330d96e492",
//   contract: "0x45A760B3E83FF8C107C4df955b1483De0982F393",
//   depositInfo: "90/10 BPT",
//   depositToken: "BPT",
//   apyRate: "26.85",  
// ]

export const options: any[] = []

@Injectable({
  providedIn: 'root'
})
export class OptionService {

  availablePairs: any[] = [
    // { pair: "AUD/USD", pair_contract: "0x5813A90f826e16dB392abd2aF7966313fc1fd5B8" },
    // { pair: "BAT/USD", pair_contract: "0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219" },
    // { pair: "BNB/USD", pair_contract: "0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16" },
    // { pair: "BTC/USD", pair_contract: "0x6135b13325bfC4B00278B4abC5e20bbce2D6580e" },
    // { pair: "CHF/USD" , pair_contract: "0xed0616BeF04D374969f302a34AE4A63882490A8C" },
    // { pair: "DAI/USD" , pair_contract: "0x777A68032a88E5A84678A77Af2CD65A7b3c0775a" },
    { pair: "ETH/USD", pair_contract: "0x9326BFA02ADD2366b30bacB125260Af641031331" },
    // { pair: "EUR/USD", pair_contract: "0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13" },
    // { pair: "GBP/USD", pair_contract: "0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9" },
    // { pair: "JPY/USD", pair_contract: "0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942" },
    // { pair: "LINK/USD", pair_contract: "0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0" },
    // { pair: "LTC/USD", pair_contract: "0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640" },
    // { pair: "Oil/USD", pair_contract: "0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea" },
    // { pair: "SNX/USD", pair_contract: "0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD" },
    // { pair: "XAG/USD", pair_contract: "0x4594051c018Ac096222b5077C3351d523F93a963" },
    // { pair: "XAU/USD", pair_contract: "0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5" },
    // { pair: "XRP/USD", pair_contract: "0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3" },
    // { pair: "XTZ/USD", pair_contract: "0xC6F39246494F25BbCb0A8018796890037Cb5980C" },
    // { pair: "sDEFI/USD", pair_contract: "0x70179FB2F3A0a5b7FfB36a235599De440B0922ea" }
    ]  
  
  
    availableOptions: any[] = [
      { ticker: "OPUSD", name: "OpenPredict USD", pair_contract: "0x0bF499444525a23E7Bb61997539725cA2e928138" },
      ]      

  constructor( private optionsStore: OptionsStore ) { }
  
    
  get(): Observable<void> {
    const request = timer(500).pipe(
      mapTo(options),
      map(response => this.optionsStore.set(response))
    );
    return cacheable(this.optionsStore, request);
  }



}
