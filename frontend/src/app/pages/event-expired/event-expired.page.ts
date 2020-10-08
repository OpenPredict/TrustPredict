import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { Observable, of } from 'rxjs';
import { UiService } from '@app/services/ui-service/ui.service';
import { Position, Side } from '@app/data-model';

@Component({
  selector: 'app-event-expired',
  templateUrl: './event-expired.page.html',
  styleUrls: ['./event-expired.page.scss'],
})
export class EventExpiredPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery,
    private ui: UiService) {
      console.log('created');
    }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
        map( params => params.get('eventId') ),
        filter(id => !this.eventsQuery.hasEntity(id)),
        untilDestroyed(this),
        switchMap(id => this.eventsService.getEvent(id))
      ).subscribe();
  }

  ngOnDestroy(){}

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;

    try {
     const interaction = await this.ui
                             .loading(  this.eventsService.revoke(eventId),
                             'You will be prompted for 2 contract interactions, please approve both to successfully take part and please be patient as it may take a few moments to broadcast to the network.' )
                             .catch( e => alert(`Error with contract interactions ${JSON.stringify(e)}`) );

     if (interaction) {
      alert('Success ! Your stake has been placed');
    }
    } catch (error) {
      alert(`Error ! ${error}`);
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  getClass(betSide: Side): string {
    return (betSide === Side.Higher) ? 'status-green' : 'status-red';
  }

  getConditionText(betSide: Side): string {
    return (betSide === Side.Higher) ? 'higher than' : 'lower than';
  }

  getToken(position: Position, betSide: Side): string {
    return this.eventsService.getToken(position, betSide);
  }
}
