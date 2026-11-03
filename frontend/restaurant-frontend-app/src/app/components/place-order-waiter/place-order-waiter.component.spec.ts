import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlaceOrderWaiterComponent } from './place-order-waiter.component';
import { AuthenticationService } from '@app/auth/services/authentication.service';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';

describe('PlaceOrderWaiterComponent', () => {
  let component: PlaceOrderWaiterComponent;
  let fixture: ComponentFixture<PlaceOrderWaiterComponent>;

  const auth = {
    getUser: () => ({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.api',
      role: 'Waiter',
    }),
    getUserNameById$: () => of('John Doe'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://test.api' },
        { provide: AuthenticationService, useValue: auth },
      ],
      imports: [PlaceOrderWaiterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceOrderWaiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
