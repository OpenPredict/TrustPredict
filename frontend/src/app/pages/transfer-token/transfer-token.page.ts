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
import { UiService } from '@app/services/ui-service/ui.service';
import { Position } from '@app/data-model';
import { of } from 'rxjs';
import { CustomValidators } from '@app/helpers/CustomValidators';

@Component({
  selector: 'app-transfer-token',
  templateUrl: './transfer-token.page.html',
  styleUrls: ['./transfer-token.page.scss'],
})
export class TransferTokenPage  extends BaseForm implements OnInit {
  
  public Position = Position;

  get eventId() {
    return this.activatedRoute.snapshot.params.eventId;
  }

  get position() {
    const position = this.activatedRoute.snapshot.params.position; // get the position boolean from url
    return (position === '0') ? Position.Right : Position.Left;
  }

  get tokenName() {
    return "OI"
    // return this.activatedRoute.snapshot.params.token; 
  }

  // termsAndConditions = 'https://openpredict.io';
  // event$ = this.eventsQuery.selectEntity(this.eventId);
  event$ = of({
    asset_icon: "/assets/img/aud.svg",
    asset_name: "Australian Dollar",
    asset_ticker: "AUD",
    completion: "14 Oct 2020 13:28:27",
    condition_price: "1.0",
    created: "12 Oct 2020 13:28:40",
    creator: "0x90C3428564f123384027552D6EA0D489e54F0222",
    id: "0xc8b80401fab5efc763cb3704ad558f3665484635",
    ratio: "",
    side: 1,
    status: 1,
    value: "100.0 USD"    
  })
  
  availableOptions: any[];

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private optService: OptionService,
    private ui: UiService,
    private eventsService: OpEventService,
    private eventsQuery: OpEventQuery) {
      super();
      this.availableOptions = this.optService.availableOptions;

      this.form = this.fb.group({
        transfer_amount: [null, Validators.compose([Validators.required, Validators.min(100), Validators.pattern('^[1-9]+[0-9]*00$')])],
        transfer_to: [null, Validators.compose(
          [Validators.required, Validators.minLength(42), Validators.maxLength(42), CustomValidators.isAddress])
        ],        
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

  async continue() {
    const eventId = this.activatedRoute.snapshot.params.eventId;
    const numTokensStakedToStake = parseFloat(this.form.controls['option_stake'].value);
    const selection = this.activatedRoute.snapshot.params.stake;

    try {
     const interaction = await this.ui
                             .loading(  this.eventsService.stake(eventId, numTokensStakedToStake, selection),
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

  getConditionText(): string {
    return this.eventsService.getConditionText(this.position);
  }

  getClass(): string {
    return this.eventsService.getClass(this.position);
  }

  // replace with live terms and conditons url
  openTnC() {
    // this.ui.openIAB(this.termsAndConditions);
  }


}

