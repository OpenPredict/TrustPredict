import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventConditionPage } from './event-condition.page';

describe('EventConditionPage', () => {
  let component: EventConditionPage;
  let fixture: ComponentFixture<EventConditionPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventConditionPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventConditionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
