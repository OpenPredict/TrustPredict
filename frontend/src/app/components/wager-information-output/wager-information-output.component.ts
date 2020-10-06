import { Component, OnInit } from '@angular/core';
import { OptionService } from '@services/option-service/option.service';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { OptionQuery } from '@services/option-service/option.service.query';
import { BaseForm } from '@app/helpers/BaseForm';
import { FormBuilder, Validators } from '@angular/forms';
import { OptionsStore } from '@app/services/option-service/option.service.store';
import { IOptionsPriceWager } from '@app/data-model';

@Component({
  selector: 'app-wager-information-output',
  templateUrl: './wager-information-output.component.html',
  styleUrls: ['./wager-information-output.component.scss'],
})
export class WagerInformationOutputComponent implements OnInit {

  wager: IOptionsPriceWager;

  condition_price: number;
  conditionText: string;


  constructor(
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
  ) { }

  ngOnInit() {
    this.optQry.selectAll().subscribe( res => {
      console.log(JSON.stringify(res));
      this.wager = res['entities'];
    });
  }


  conditionTxt( wagerCondition: boolean  ): string {
    return ( wagerCondition = true ) ? 'more than' : 'less than';
  }


}
