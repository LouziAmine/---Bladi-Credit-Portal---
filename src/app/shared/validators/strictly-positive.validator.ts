import { AbstractControl, ValidationErrors } from '@angular/forms';

export function strictlyPositive(ctrl: AbstractControl): ValidationErrors | null {
  const value = ctrl.value as number | null;
  return value === null || value > 0 ? null : { strictlyPositive: true };
}
