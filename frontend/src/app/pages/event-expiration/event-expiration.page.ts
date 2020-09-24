import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import  *  as moment from "moment";

@Component({
  selector: 'app-event-expiration',
  templateUrl: './event-expiration.page.html',
  styleUrls: ['./event-expiration.page.scss'],
})
export class EventExpirationPage  extends BaseForm implements OnInit {

  loading$: Observable<boolean>;
  
  min: string

  constructor( 
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,    
    public navCtrl: NavController ) {
      super()
      this.form = this.fb.group({
        expiration_date: [this.min, Validators.compose([Validators.required])],   
      });    
    }
  
    ngOnInit() {
    this.min = moment().add(2, 'days').toISOString()
    }
      
    continue() {
      this.setSubmitted()
      if (!this.form.valid) {
        return
      }
      try {
        const expiry = this.form.controls['expiration_date'].value
        var a = moment()
        var b = moment(expiry);
        const seconds =  a.diff(b, 'seconds') 
        this.optStr.upsert(1, { expiration_date: Number( Math.abs(seconds) ) } )       
        this.navCtrl.navigateForward([`/launch-option`])        
      } catch (error) {
        console.log(`Error: ${error}`)
       }           
    }
    
    goBack() {
      this.navCtrl.back()
    }        

}
