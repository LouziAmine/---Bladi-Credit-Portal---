import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FooterComponent as Footer } from './footer.component';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let component: Footer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the current year', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const currentYear = new Date().getFullYear().toString();
    expect(compiled.textContent).toContain(currentYear);
  });

  it('should display Credit Bladi branding', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Credit Bladi');
  });
});