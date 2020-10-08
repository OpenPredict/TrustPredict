import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventSettledPage } from './event-settled.page';

describe('EventSettledPage', () => {
  let component: EventSettledPage;
  let fixture: ComponentFixture<EventSettledPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventSettledPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventSettledPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
