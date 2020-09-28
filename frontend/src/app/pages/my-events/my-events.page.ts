import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { OptionQuery } from '@services/option-service/option.service.query';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { CryptoService } from '@app/services/crypto-service/crypto.service';
import { UiService } from "@services/ui-service/ui.service";
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { IEvent } from '@app/data-model';
import { OpEventQuery } from "@services/op-event-service/op-event.service.query";


@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
})
export class MyEventsPage extends BaseForm implements OnInit {
  
  events$: Observable<IEvent[]>
  
  constructor( 
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    public opEventSrv: OpEventService,
    private eventQuery:OpEventQuery,
    private optStr: OptionsStore,    
    public ui: UiService,
    private crypto: CryptoService,
    public navCtrl: NavController ) {
      super()
      this.form = this.fb.group({
        contract_address: [null, Validators.compose([Validators.required, Validators.minLength(42), Validators.maxLength(42), CustomValidators.isAddress])],  
      });      
    }
  
  ngOnInit() {  
    this.opEventSrv.get().subscribe();    
    this.allEvents()
    this.form.valueChanges.subscribe( 
      (res) => {
        if(this.form.controls['contract_address'].valid) {
          this.events$ = this.eventQuery.getEvent( this.form.controls['contract_address'].value )
        } else {
          this.allEvents()          
        }
      }
    )      
  }
  
  allEvents() {
    this.events$ = this.eventQuery.selectAll()    
  }
  
  async continue() {
      try {     
        console.log("user has entered a custom contract address....")
      } catch (error) {
        alert(`Error ! ${error}`)
      }         
  }  
  
  openEvent(event: IEvent) {
    console.log(event)
    this.navCtrl.navigateForward(`/event-overview/${event.id}`)
  }
  

}
