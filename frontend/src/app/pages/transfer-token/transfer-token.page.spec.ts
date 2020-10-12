import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TransferTokenPage } from './transfer-token.page';

describe('TransferTokenPage', () => {
  let component: TransferTokenPage;
  let fixture: ComponentFixture<TransferTokenPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransferTokenPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferTokenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
