import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { UiService } from '@services/ui-service/ui.service';
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from '@app/helpers/CustomValidators';
import { IEvent, Status } from '@app/data-model';
import { OpEventQuery } from '@services/op-event-service/op-event.service.query';
import { OpBalanceService } from '@app/services/op-balance-service/op-balance.service';


@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
})
export class MyEventsPage extends BaseForm implements OnInit {

  modalHeader = 'Event Listings';
  modalTxt = `
    <h2>Pending Events</h2>
      <p>
        When events are launched, there is a window of time (24 hours) in which there can be 'stakes' on the event. 
        When events are in this state we say the event is 'Pending'.
      </p>
    <h2>Active Events</h2>
      <p>
        After the 24 hour window has passed, if the event has reached the minimum stake required, it moves into the 'Active'
        state. In the active state it can no longer receive stakes; however, the tokens representing outcomes in the event may be traded.
        The token valuation will change depending on the direction of the outcomes of the event.
      </p>
    <h2>My Events</h2>
      <p>
        This window contains all events your wallet has been involved in, that is;
        <ul>
          <li>events created</li>
          <li>events holding O/IO tokens in</li>
        </ul>
        This also includes events that failed to go active (Expired Events) and events that have finalized (Settled Events) that involved the
        currently connected wallet in some way.
      </p>`;

  pendingEvents$: Observable<IEvent[]>;
  activeEvents$: Observable<IEvent[]>;
  myEvents$: Observable<IEvent[]>;
  activeEventType = 1;

  constructor(
    private fb: FormBuilder,
    private optionService: OptionService,
    public opEventService: OpEventService,
    public opBalanceService: OpBalanceService,
    private eventQuery: OpEventQuery,
    public ui: UiService,
    public navCtrl: NavController) {
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

    this.form.valueChanges.subscribe(() => { this.allEvents(); });
  }

  allEvents() {
    console.log('optionService address:' + this.optionService.address);

    this.pendingEvents$ = this.eventQuery.selectAll({
      filterBy: state => state.status === Status.Staking
    });

    this.activeEvents$ = this.eventQuery.selectAll({
      filterBy: state => state.status === Status.Active
    });

    this.myEvents$ = this.eventQuery.selectAll({
      filterBy: state => {
        const balance = this.opBalanceService.getById(this.opBalanceService.getID(String(state.id)));
        return ((state.creator === this.optionService.address) || ((balance.IOToken + balance.OToken) > 0));
      }
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
      (event.status === Status.Active) ? this.navCtrl.navigateForward(`/event-overview/${event.id}`) :
      (event.status === Status.Expired) ? this.navCtrl.navigateForward(`/event-expired/${event.id}`) :
        (event.status === Status.Settled) ? this.navCtrl.navigateForward(`/event-settled/${event.id}`) : '';
  }

  displayEventType(eventType: number) {
    this.activeEventType = eventType;
  }

}
