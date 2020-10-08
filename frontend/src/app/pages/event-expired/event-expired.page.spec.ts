import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventExpiredPage } from './event-expired.page';

describe('EventExpiredPage', () => {
  let component: EventExpiredPage;
  let fixture: ComponentFixture<EventExpiredPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventExpiredPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventExpiredPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
