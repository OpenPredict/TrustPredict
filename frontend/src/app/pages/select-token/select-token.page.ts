import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { BaseForm } from '@app/helpers/BaseForm';
import { OptionService } from '@services/option-service/option.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-select-token',
  templateUrl: './select-token.page.html',
  styleUrls: ['./select-token.page.scss'],
})
export class SelectTokenPage extends BaseForm implements OnInit {

  loading$: Observable<boolean>;

  assets = {};
  
  modalHeader = "Header will be in the H1 tag of the modal"
  modalTxt = "<p>RAW HTML tags</p><br><p>Dont forget the p tags</p>"  
    
  constructor(
    private fb: FormBuilder,
    private optService: OptionService,
    public navCtrl: NavController ) {
      super();

      this.assets = this.optService.availableAssets;

      console.log(this.assets);

      this.form = this.fb.group({
        contract: [null],
        asset: [null, Validators.compose([Validators.required])],
      });
    }

  ngOnInit() {
    this.form.valueChanges.subscribe( res => console.log(JSON.stringify(res)) );
  }

  select(t: any) {
   return t.selected = !t.selected;
  }

  continue() {
    this.setSubmitted()
    if (!this.form.valid) {
      return;
    }
    try {
      this.navCtrl.navigateForward([`/event-condition`])
    } catch (error) {
      console.log(`Error: ${error}`);
     }
  }


  goBack() {
    this.navCtrl.back();
  }

}
