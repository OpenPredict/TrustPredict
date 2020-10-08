import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { OptionQuery } from '@services/option-service/option.service.query';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { CryptoService } from '@app/services/crypto-service/crypto.service';
import { UiService } from '@services/ui-service/ui.service';
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { IEvent, Status } from '@app/data-model';
import { OpEventQuery } from '@services/op-event-service/op-event.service.query';


@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
})
export class MyEventsPage extends BaseForm implements OnInit {

  activeEvents$: Observable<IEvent[]>;
  pendingEvents$: Observable<IEvent[]>;  
  myEvents$: Observable<IEvent[]>;    
  activeEventType: number = 1

  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    public opEventSrv: OpEventService,
    private eventQuery: OpEventQuery,
    private optStr: OptionsStore,
    public ui: UiService,
    private crypto: CryptoService,
    public navCtrl: NavController ) {
      super();
      this.form = this.fb.group({
        event_id: [null, Validators.compose(
          [Validators.required, Validators.minLength(42), Validators.maxLength(42), CustomValidators.isAddress])
        ],
      });
    }

  ngOnInit() {
    this.opEventSrv.get().subscribe();
    this.allEvents();
    this.form.valueChanges.subscribe(
      (res) => {
        if(this.form.controls['event_id'].valid) {
          this.activeEvents$ = this.eventQuery.getEvent( this.form.controls['event_id'].value );
        } else {
          this.allEvents();
        }
      }
    );
  }

  allEvents() {
    this.activeEvents$ = this.eventQuery.selectAll(); // this.eventQuery.selectAll({ filterBy: state => state.status === "something" });
    this.pendingEvents$ = this.eventQuery.selectAll(); // again another filter here whatever it is going to be from the contract
    this.myEvents$ = this.eventQuery.selectAll(); // again another filter here whatever it is going to be from the contract    
  }

  async continue() {
      try {
        console.log('user has entered a custom event ID....');
      } catch (error) {
        alert(`Error ! ${error}`);
      }
  }

  openEvent(event: IEvent) {
    console.log(event);
    (event.status === Status.Staking) ? this.navCtrl.navigateForward(`/event-overview/${event.id}`) :
    (event.status === Status.Expired) ? this.navCtrl.navigateForward(`/event-expired/${event.id}`) :
    (event.status === Status.Settled) ? this.navCtrl.navigateForward(`/event-settled/${event.id}`) :
    (event.status === Status.Active);
  }

  displayEventType(eventType: number) {
    this.activeEventType = eventType
  }

}
