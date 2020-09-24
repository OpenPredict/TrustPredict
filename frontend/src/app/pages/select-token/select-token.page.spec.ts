import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectTokenPage } from './select-token.page';

describe('SelectTokenPage', () => {
  let component: SelectTokenPage;
  let fixture: ComponentFixture<SelectTokenPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectTokenPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectTokenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
