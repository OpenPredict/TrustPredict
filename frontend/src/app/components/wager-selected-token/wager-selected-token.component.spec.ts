import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WagerSelectedTokenComponent } from './wager-selected-token.component';

describe('WagerSelectedTokenComponent', () => {
  let component: WagerSelectedTokenComponent;
  let fixture: ComponentFixture<WagerSelectedTokenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WagerSelectedTokenComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WagerSelectedTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
