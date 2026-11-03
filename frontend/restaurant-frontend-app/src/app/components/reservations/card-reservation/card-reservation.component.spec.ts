import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CardReservationComponent } from './card-reservation.component';

describe('CardReservationComponent', () => {
  let component: CardReservationComponent;
  let fixture: ComponentFixture<CardReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
      imports: [CardReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardReservationComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('r', {
      id: 'reservation-1',
      tableId: 'table-1',
      startTime: new Date('2026-01-01T12:00:00Z'),
      endTime: new Date('2026-01-01T14:00:00Z'),
      guestCount: 2,
      status: 0,
      restaurantName: 'Test Restaurant',
      locationAddress: 'Test Address',
      waiterId: 'waiter-1',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
