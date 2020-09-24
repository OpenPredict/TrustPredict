import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventExpirationPage } from './event-expiration.page';

describe('EventExpirationPage', () => {
  let component: EventExpirationPage;
  let fixture: ComponentFixture<EventExpirationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventExpirationPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventExpirationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
