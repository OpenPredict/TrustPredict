import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LaunchOptionPage } from './launch-option.page';

describe('LaunchOptionPage', () => {
  let component: LaunchOptionPage;
  let fixture: ComponentFixture<LaunchOptionPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LaunchOptionPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LaunchOptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
