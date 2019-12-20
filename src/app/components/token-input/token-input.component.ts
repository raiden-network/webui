import {
    Component,
    forwardRef,
    Input,
    ViewChild,
    ElementRef
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    ValidatorFn
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { BigNumber } from 'bignumber.js';
import {
    amountFromDecimal,
    amountToDecimal
} from '../../utils/amount.converter';

@Component({
    selector: 'app-token-input',
    templateUrl: './token-input.component.html',
    styleUrls: ['./token-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TokenInputComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TokenInputComponent),
            multi: true
        }
    ]
})
export class TokenInputComponent implements ControlValueAccessor, Validator {
    @Input() allowZero: boolean;
    @Input() placeholder: string;
    @Input() errorPlaceholder: string;
    @ViewChild('amountInput', { static: true }) amountInput: ElementRef;

    readonly inputControl = new FormControl(
        new BigNumber(0),
        this.amountValidator()
    );
    decimals = 0;

    constructor() {}

    resetAmount() {
        this.inputControl.reset(new BigNumber(0));
    }

    minimumAmount(): string {
        return (1 / 10 ** this.decimals).toFixed(this.decimals);
    }

    convertFromDecimal() {
        const amount: BigNumber = this.inputControl.value;
        if (
            BigNumber.isBigNumber(amount) &&
            amount.decimalPlaces() <= this.decimals
        ) {
            this.inputControl.setValue(
                amountFromDecimal(amount, this.decimals),
                { emitModelToViewChange: false }
            );
        }
    }

    registerOnChange(fn: any): void {
        this.inputControl.valueChanges.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.inputControl.registerOnChange(fn);
    }

    registerOnValidatorChange(fn: () => void): void {}

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.inputControl.disable();
        } else {
            this.inputControl.enable();
        }
    }

    validate(c: AbstractControl): ValidationErrors | null {
        const value: BigNumber = this.inputControl.value;

        if (!BigNumber.isBigNumber(value) || value.isNaN()) {
            return {
                notANumber: true
            };
        }
        if (this.allowZero && value.isZero()) {
            return null;
        }
        if (!value) {
            return { empty: true };
        }
        return this.inputControl.errors;
    }

    writeValue(obj: any): void {
        if (!obj) {
            return;
        }
        this.inputControl.setValue(new BigNumber(obj), { emitEvent: false });
    }

    onFocus(): void {
        if (!this.inputControl.dirty) {
            this.inputControl.setValue('');
        }
    }

    private amountValidator(): ValidatorFn {
        return (control: AbstractControl) => {
            const value: BigNumber = control.value;

            if (!BigNumber.isBigNumber(value) || value.isNaN()) {
                return {
                    notANumber: true
                };
            } else if (value.decimalPlaces() > 0) {
                return {
                    tooManyDecimals: true
                };
            } else if (!this.allowZero && value.isZero()) {
                return {
                    invalidAmount: true
                };
            }
            return undefined;
        };
    }
}
