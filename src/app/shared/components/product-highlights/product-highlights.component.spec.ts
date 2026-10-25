import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductHighlightsComponent } from './product-highlights.component';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';

describe('ProductHighlightsComponent', () => {
  let fixture: ComponentFixture<ProductHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductHighlightsComponent],
      providers: [provideTranslateTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductHighlightsComponent);
    fixture.componentRef.setInput('i18nPrefix', 'mortgageCredit');
    fixture.componentRef.setInput('reasons', [
      { key: 'digital', icon: 'bi-laptop' },
      { key: 'expertise', icon: 'bi-buildings' },
    ]);
    fixture.componentRef.setInput('stepIcons', ['bi-calculator', 'bi-send', 'bi-house-check']);
    fixture.detectChanges();
  });

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('numbers each reason with its icon', () => {
    const cards = element().querySelectorAll('.cb-why-card');
    expect(cards.length).toBe(2);
    expect(cards[1].querySelector('.cb-why-card__num')?.textContent?.trim()).toBe('2');
    expect(cards[1].querySelector('i')?.classList).toContain('bi-buildings');
  });

  it('links every step but the last, which is highlighted', () => {
    const steps = element().querySelectorAll('.cb-step-item');
    expect(steps.length).toBe(3);
    expect(element().querySelectorAll('.cb-step-item__connector').length).toBe(2);
    expect(steps[2].classList).toContain('cb-step-item--last');
    expect(steps[2].querySelector('.cb-step-item__circle--accent')).not.toBeNull();
  });
});
