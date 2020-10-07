import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventCompletedPage } from './event-completed.page';

describe('EventCompletedPage', () => {
  let component: EventCompletedPage;
  let fixture: ComponentFixture<EventCompletedPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventCompletedPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCompletedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
