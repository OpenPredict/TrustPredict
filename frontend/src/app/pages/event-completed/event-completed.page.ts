import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-event-completed',
  templateUrl: './event-completed.page.html',
  styleUrls: ['./event-completed.page.scss'],
})
export class EventCompletedPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  get page() {
    const page = this.activatedRoute.snapshot.params.page; // get the mint boolean from url
    return (page === '0') ? false : true;
  }

  // false = expired / true is winner
  HARD_EXPIRED_OR_WINNER: boolean = this.page;

  event$ = this.eventsQuery.selectEntity(this.eventId);

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery) {
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

  goBack() {
    this.navCtrl.back();
  }

  getConditionText(condition: boolean): string {
    return this.eventsService.getConditionText(condition);
  }

  getClass(condition: boolean): string {
    return this.eventsService.getClass(condition);
  }
}
