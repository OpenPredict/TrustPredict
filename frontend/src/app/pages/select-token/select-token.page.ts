import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-select-token',
  templateUrl: './select-token.page.html',
  styleUrls: ['./select-token.page.scss'],
})
export class SelectTokenPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  
  assets: any = [{
    icon: "/assets/img/eth.svg",
    name: "Ethereum",
    ticker: "ETH",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/usdt.svg",
    name: "Tether",
    ticker: "USDT",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/chainlink.svg",
    name: "Chainlink",
    ticker: "LINK",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/usdc.svg",
    name: "USD Coin",
    ticker: "USDC",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/cdai.svg",
    name: "Compound Dai",
    ticker: "CDAI",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/lend.svg",
    name: "Aave",
    ticker: "CDAI",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/snx.svg",
    name: "Synthetix Network Token",
    ticker: "SNX",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/eth.svg",
    name: "Ethereum",
    ticker: "ETH",
    contract: ""
  },{
    icon: "/assets/img/usdt.svg",
    name: "Tether",
    ticker: "USDT",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/chainlink.svg",
    name: "Chainlink",
    ticker: "LINK",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/usdc.svg",
    name: "USD Coin",
    ticker: "USDC",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/cdai.svg",
    name: "Compound Dai",
    ticker: "CDAI",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/lend.svg",
    name: "Aave",
    ticker: "CDAI",
    contract: "",
    selected: false
  },{
    icon: "/assets/img/snx.svg",
    name: "Synthetix Network Token",
    ticker: "SNX",
    contract: "",
    selected: false
  }]
  
  constructor( 
    private fb: FormBuilder,
    public navCtrl: NavController ) {
      super()
      
      console.log(this.assets)
      
      this.form = this.fb.group({
        contract: [null],   
        asset: [null, Validators.compose([Validators.required])],   
      });         
    }
  
  ngOnInit() {
    this.form.valueChanges.subscribe( res => console.log(JSON.stringify(res)) )
  }
  
  select(t: any) {
   return t.selected = !t.selected
  }
  
  continue() {
    this.setSubmitted()
    if (!this.form.valid) {
      return
    }
    try {
      this.navCtrl.navigateForward([`/event-condition`])
    } catch (error) {
      console.log(`Error: ${error}`)
     }           
  }
  
  
  goBack() {
    this.navCtrl.back()
  }

}
