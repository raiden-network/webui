import { Component, forwardRef, ViewChild } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS
} from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
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
    @ViewChild(MatExpansionPanel, { static: true })
    panel: MatExpansionPanel;

    readonly identifierFc = new FormControl(null, this.identifierValidator());

    constructor() {}

    public resetPanel() {
        this.panel.close();
    }

    public onClose() {
        this.identifierFc.reset(null);
    }

    registerOnChange(fn: any): void {
        this.identifierFc.valueChanges.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.identifierFc.registerOnChange(fn);
    }

    registerOnValidatorChange(fn: () => void): void {}

    validate(c: AbstractControl): ValidationErrors | null {
        return this.identifierFc.errors;
    }

    writeValue(obj: any): void {
        if (!obj) {
            this.identifierFc.reset(null, { emitEvent: false });
            return;
        }
        this.identifierFc.setValue(new BigNumber(obj), { emitEvent: false });
    }

    private identifierValidator(): ValidatorFn {
        return (control: AbstractControl) => {
            if (control.pristine && control.untouched) {
                return undefined;
            }
            const value: BigNumber = control.value;
            if (!BigNumber.isBigNumber(value) || value.isNaN()) {
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
