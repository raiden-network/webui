import { Component, forwardRef } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    FormBuilder,
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'app-payment-identifier-input',
    templateUrl: './payment-identifier-input.component.html',
    styleUrls: ['./payment-identifier-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PaymentIdentifierInputComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PaymentIdentifierInputComponent),
            multi: true
        }
    ]
})
export class PaymentIdentifierInputComponent implements ControlValueAccessor {
    readonly form: FormGroup = this.fb.group({
        payment_identifier: new FormControl(
            { value: 0, disabled: true },
            this.identifierValidator()
        ),
        edit_box: false
    });
    readonly identifierControl: FormControl;
    readonly checkboxControl: FormControl;

    constructor(private fb: FormBuilder) {
        this.identifierControl = this.form.get(
            'payment_identifier'
        ) as FormControl;
        this.checkboxControl = this.form.get('edit_box') as FormControl;
    }

    public get paymentIdentifier(): BigNumber {
        return new BigNumber(this.identifierControl.value);
    }

    public resetEditability() {
        this.checkboxControl.reset(false);
        this.checkboxControl.enable();
        this.identifierControl.disable({ emitEvent: false });
    }

    public onCheckChange(event: MatCheckboxChange) {
        if (event.checked) {
            this.identifierControl.enable();
            this.checkboxControl.disable();
        }
    }

    registerOnChange(fn: any): void {
        this.identifierControl.valueChanges.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.identifierControl.registerOnChange(fn);
    }

    registerOnValidatorChange(fn: () => void): void {}

    validate(c: AbstractControl): ValidationErrors | null {
        return this.identifierControl.errors;
    }

    writeValue(obj: any): void {
        if (!obj) {
            this.identifierControl.reset('', { emitEvent: false });
            return;
        }
        this.identifierControl.setValue(obj, { emitEvent: false });
    }

    private identifierValidator(): ValidatorFn {
        return (control: AbstractControl) => {
            const value = new BigNumber(control.value);
            if (value.isNaN()) {
                return {
                    notANumber: true
                };
            } else if (value.isLessThan(0)) {
                return {
                    invalidNumber: true
                };
            }
            return undefined;
        };
    }
}
