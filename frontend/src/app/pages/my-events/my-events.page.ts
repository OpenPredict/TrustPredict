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
import { AuthQuery } from '@app/services/auth-service/auth.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';


@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
})
export class MyEventsPage extends BaseForm implements OnInit {

  modalHeader = "Header will be in the H1 tag of the modal"
  modalTxt = "<p>RAW HTML tags</p><br><p>Dont forget the p tags</p>"  
  
  pendingEvents$: Observable<IEvent[]>;
  activeEvents$: Observable<IEvent[]>;
  myEvents$: Observable<IEvent[]>;
  activeEventType = 1;

  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    private optQry: OptionQuery,
    public opEventService: OpEventService,
    public opBalanceService: OpBalanceService,
    private authQ: AuthQuery,
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

  async ngOnInit() {
    this.opEventService.get().subscribe();
    this.allEvents();

    this.form.valueChanges.subscribe(
      (res) => {
        if (this.form.controls['event_id'].valid) {
          this.activeEvents$ = this.eventQuery.getEvent( this.form.controls['event_id'].value );
        } else {
          this.allEvents();
        }
      }
    );
  }

  allEvents() {
    const _USER: any  = this.authQ.getValue();
    const signer: any = _USER.signer;

    const balances = [];

    signer.getAddress().then(async (address) => {
      await Promise.all(Object.keys(this.opEventService.events).map(async (_eventKey) => {
        const _event = this.opEventService.events[_eventKey];
        console.log('_event.id: ' + _event.id);
        const balance = this.opBalanceService.getById(_event.id);
        balances[_event.id] = balance.IOToken + balance.OToken;
        console.log('balances[_event.id]: ' + balances[_event.id].toString());
        console.log('address:' + address);
      }));

      this.pendingEvents$ = this.eventQuery.selectAll({
        filterBy: state => state.status === Status.Staking
      });
      this.activeEvents$ = this.eventQuery.selectAll({
        filterBy: state => state.status === Status.Active
      });

      this.eventQuery.selectAll().subscribe( res => console.log(`events with status Active ${JSON.stringify(res)}`) );


      this.myEvents$ = this.eventQuery.selectAll({
        filterBy: state => ((state.creator === address) || (balances[state.id] > 0))
      });
    });
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
    (event.status === Status.Staking) ||
    (event.status ===  Status.Active) ? this.navCtrl.navigateForward(`/event-overview/${event.id}`) :
    (event.status === Status.Expired) ? this.navCtrl.navigateForward(`/event-expired/${event.id}`) :
    (event.status === Status.Settled) ? this.navCtrl.navigateForward(`/event-settled/${event.id}`) : '';
  }

  displayEventType(eventType: number) {
    this.activeEventType = eventType;
  }

}
