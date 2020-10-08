import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { Position, Side } from '@app/data-model';

@Component({
  selector: 'app-event-overview',
  templateUrl: './event-overview.page.html',
  styleUrls: ['./event-overview.page.scss'],
})
export class EventOverviewPage implements OnInit, OnDestroy {
  private Position = Position;

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  event$ = this.eventsQuery.selectEntity(this.eventId);

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery) {
      console.log('construct');
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

  goBack() {
    this.navCtrl.back();
  }

  getConditionText(position: Position): string {
    return this.eventsService.getConditionText(position);
  }

  getClass(position: Position): string {
    return this.eventsService.getClass(position);
  }

  getToken(position: Position, betSide: Side): string {
    return this.eventsService.getToken(position, betSide);
  }

  /**
   * Opens the staking page
   * @param token token string
   * @param position if coming from the LHS or RHS
   */
  continue(token: string, position: Position): void {
    this.navCtrl.navigateForward(`/event-overview-stake/${this.eventId}/${token}/${position}`);
  }

}
