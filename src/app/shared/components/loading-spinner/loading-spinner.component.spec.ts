import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { LoadingSpinnerComponent as LoadingSpinner } from './loading-spinner.component';

describe('LoadingSpinner', () => {
  let fixture: ComponentFixture<LoadingSpinner>;
  let componentRef: ComponentRef<LoadingSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinner);
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render when loading is false', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cb-loading')).toBeNull();
  });

  it('should render spinner when loading is true', () => {
    componentRef.setInput('loading', true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cb-spinner')).toBeTruthy();
  });

  it('should display custom message', () => {
    componentRef.setInput('loading', true);
    componentRef.setInput('message', 'Simulation en cours...');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Simulation en cours...');
  });
});