import { Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ActivatedRoute } from '@angular/router';
import { OpEventService } from '@app/services/op-event-service/op-event.service';
import { OpEventQuery } from '@app/services/op-event-service/op-event.service.query';
import { NavController } from '@ionic/angular';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionService } from '@app/services/option-service/option.service';

@Component({
  selector: 'app-event-overview-mint',
  templateUrl: './event-overview-mint.page.html',
  styleUrls: ['./event-overview-mint.page.scss'],
})
export class EventOverviewMintPage extends BaseForm implements OnInit {

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }  
  
  get mint() {
    const mint = this.activatedRoute.snapshot.params.mint; // get the mint boolean from url
    return (mint == "0") ? false : true;
  }     
  
  get tokenName() {
    return (!this.mint) ? "OI" : "O";
  }    

  event$ = this.eventsQuery.selectEntity(this.eventId);
  availableOptions: any[]
  
  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private optService: OptionService,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery) {
      super()
      this.availableOptions = this.optService.availableOptions      
      
      this.form = this.fb.group({
        option_asset: [this.availableOptions[0], Validators.compose([Validators.required])],  
        option_stake: [null, Validators.compose([Validators.required, Validators.min(100), Validators.pattern('^[1-9]+[0-9]*00$')])],           
      });     
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
    this.navCtrl.back()
  }    
  
  getConditionText(): string {
    return this.eventsService.getConditionText(this.mint)
  }  
  
  getClass(): string {
    return this.eventsService.getClass(this.mint)
  }  
  
  
  
  
  
}
