import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupTicketsComponent } from './tickets.component';

describe('TicketsComponent', () => {
  let component: GroupTicketsComponent;
  let fixture: ComponentFixture<GroupTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupTicketsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
