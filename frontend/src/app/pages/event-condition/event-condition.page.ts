import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { CurrencyPipe, DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-event-condition',
  templateUrl: './event-condition.page.html',
  styleUrls: ['./event-condition.page.scss'],
})
export class EventConditionPage  extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  formattedAmount: any
  
  constructor( 
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,    
    private currencyPipe : CurrencyPipe,
    private decimalPipe : DecimalPipe,    
    public navCtrl: NavController ) {
      super()
      this.form = this.fb.group({
        wager: [null, Validators.compose([Validators.required, Validators.minLength(1)])],   
        condition: ["1", Validators.compose([Validators.required])],   
      }); 
    }

    ngOnInit() {}
    
    clearAmount() {
      this.form.controls['wager'].patchValue(null) 
    }
    
    transformAmount(element){
      this.formattedAmount = this.decimalPipe.transform(this.form.controls['wager'].value, "0.2-2" );
      this.form.controls['wager'].patchValue(this.formattedAmount)
  }    
   
  
    continue() {
      this.setSubmitted()
      if (!this.form.valid) {
        return
      }
      try {
        const condition_price = this.form.controls['wager'].value
        const condition = (this.form.controls['condition'].value == "1") ? true : false
        this.optStr.upsert(1, { condition_price, condition } )       
        this.navCtrl.navigateForward([`/event-expiration`])
      } catch (error) {
        console.log(`Error: ${error}`)
       }           
    }    

    goBack() {
      this.navCtrl.back()
    }    

}
