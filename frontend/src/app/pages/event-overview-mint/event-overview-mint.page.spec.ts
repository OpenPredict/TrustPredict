import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventOverviewMintPage } from './event-overview-mint.page';

describe('EventOverviewMintPage', () => {
  let component: EventOverviewMintPage;
  let fixture: ComponentFixture<EventOverviewMintPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventOverviewMintPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventOverviewMintPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
