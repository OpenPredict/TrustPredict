import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventItemComponent } from './event-item.component';

describe('EventItemComponent', () => {
  let component: EventItemComponent;
  let fixture: ComponentFixture<EventItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventItemComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
