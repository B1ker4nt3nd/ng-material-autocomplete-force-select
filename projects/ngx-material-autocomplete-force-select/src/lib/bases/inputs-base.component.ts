import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IInputOptions } from '../../interfaces/text-input-options';

@Component({
  template: '',
})
export class InputBaseComponent {
  @Input() parentForm: FormGroup;
  @Input() controlName: string = '';
  @Input() options?: IInputOptions;

  isRequiredField(): boolean {
    const formControl = this.parentForm?.get(this.controlName) as FormControl;
    return this.formControlIsRequired(formControl);
  }
  protected formControlIsRequired(formField: FormControl): boolean {
    if (!formField.validator) {
      return false;
    }

    const validator = formField.validator({} as FormControl);
    return validator?.['required'] || false;
  }
  get getRequiredMessage(): string {
    return this.options?.requiredMessage || 'Required!';
  }
}
