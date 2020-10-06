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
  selector: 'app-wager-selected-token',
  templateUrl: './wager-selected-token.component.html',
  styleUrls: ['./wager-selected-token.component.scss'],
})
export class WagerSelectedTokenComponent implements OnInit {

  wager: IOptionsPriceWager;
  selectedToken: any;

  constructor(
    private optService: OptionService,
    private optQry: OptionQuery,
    private optStr: OptionsStore,
  ) { }

  ngOnInit() {
    this.optQry.selectAll().subscribe( (opt: IOptionsPriceWager[]) => {
      this.selectedToken = opt[0].pair;
    });
  }

  conditionTxt( wagerCondition: boolean  ): string {
    return ( wagerCondition === true ) ? 'more than' : 'less than';
  }
}
