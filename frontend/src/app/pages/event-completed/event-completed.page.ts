import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-event-completed',
  templateUrl: './event-completed.page.html',
  styleUrls: ['./event-completed.page.scss'],
})
export class EventCompletedPage implements OnInit {


  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  // false = expired / true is winner 
  HARD_EXPIRED_OR_WINNER: boolean = true 
  
  event$ = of({
    "id": "0x6f928817ca84a856de316672d91d34fd11ea294e",
    "asset_name": "Australian Dollar",
    "asset_ticker": "AUD",
    "asset_icon": "/assets/img/aud.svg",
    "condition": true,
    "condition_price": "1.0",
    "completion": "9 Oct 2020 15:32:11",
    "created": "7 Oct 2020 15:33:54",
    "value": "100.0 USD",
    "event_status": {
      "status_desc": "Expired, withdraw deposit",
      "status_value": "100.0 USD",
      "status_ratio": ""
    }
  })
  
  // event$ = this.eventsQuery.selectEntity(this.eventId);

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery) {}

  ngOnInit() {
    // this.activatedRoute.paramMap.pipe(
    //     map( params => params.get('eventId') ),
    //     filter(id => !this.eventsQuery.hasEntity(id)),
    //     untilDestroyed(this),
    //     switchMap(id => this.eventsService.getEvent(id))
    //   ).subscribe();
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

  /**
   * Opens the minting page
   * @param mintCondition if true user selected mint higher / false lower
   */
  openMinter(mintCondition: boolean): void {
    this.navCtrl.navigateForward(`/event-overview-mint/${this.eventId}/${mintCondition}`);
  }

}
