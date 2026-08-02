import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordComplexity(ctrl: AbstractControl): ValidationErrors | null {
  const value = ctrl.value as string | null;
  if (!value) {
    return null;
  }
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  return hasLower && hasUpper && hasDigit ? null : { passwordComplexity: true };
}
