import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonChatComponent } from './person-chat.component';

describe('PatientChatComponent', () => {
  let component: PersonChatComponent;
  let fixture: ComponentFixture<PersonChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
