import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DishModalComponent } from './dish-modal.component';

describe('DishModalComponent', () => {
  let component: DishModalComponent;
  let fixture: ComponentFixture<DishModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DishModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DishModalComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('dish', {
      id: 'dish-1',
      name: 'Test Dish',
      imageUrl: 'https://test.api/dish.png',
      price: 10,
      state: 'Available',
      weight: '250g',
      dishType: 'Main',
      description: 'A test dish',
      calories: '500',
      proteins: '10',
      carbohydrates: '20',
      fats: '5',
      vitamins: 'A, C',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
