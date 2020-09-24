import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectWalletPage } from './connect-wallet.page';

describe('ConnectWalletPage', () => {
  let component: ConnectWalletPage;
  let fixture: ComponentFixture<ConnectWalletPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectWalletPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectWalletPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
