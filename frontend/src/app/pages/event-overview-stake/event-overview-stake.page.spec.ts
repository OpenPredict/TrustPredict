import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventOverviewStakePage } from './event-overview-stake.page';

describe('EventOverviewStakePage', () => {
  let component: EventOverviewStakePage;
  let fixture: ComponentFixture<EventOverviewStakePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventOverviewStakePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventOverviewStakePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
