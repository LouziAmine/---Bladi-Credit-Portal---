import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ErrorMessageComponent as ErrorMessage } from './error-message.component';

describe('ErrorMessage', () => {
  let fixture: ComponentFixture<ErrorMessage>;
  let componentRef: ComponentRef<ErrorMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorMessage],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorMessage);
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render when message is null', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cb-alert')).toBeNull();
  });

  it('should render alert with message', () => {
    componentRef.setInput('message', 'Une erreur est survenue');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('.cb-alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Une erreur est survenue');
  });
});