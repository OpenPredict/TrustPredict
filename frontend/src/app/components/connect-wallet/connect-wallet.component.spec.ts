import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectWallet } from './connect-wallet.component';

describe('ConnectWallet', () => {
  let component: ConnectWallet;
  let fixture: ComponentFixture<ConnectWallet>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectWallet ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectWallet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
