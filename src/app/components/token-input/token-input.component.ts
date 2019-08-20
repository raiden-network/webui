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
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    ValidatorFn
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material';
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
    @ViewChild('amountInput') amountInput: ElementRef;

    readonly form: FormGroup = this.fb.group({
        amount: [new BigNumber(0), this.amountValidator()],
        decimals: true
    });

    private readonly inputControl: FormControl;
    private readonly checkboxControl: FormControl;

    constructor(private fb: FormBuilder) {
        this.inputControl = this.form.get('amount') as FormControl;
        this.checkboxControl = this.form.get('decimals') as FormControl;
    }

    private _decimals = 0;

    public get decimals(): number {
        return this._decimals;
    }

    public set decimals(decimals: number) {
        this._decimals = decimals;
        if (!this.checkboxControl) {
            return;
        }
        this.updateCheckboxState();
    }

    public get tokenAmountDecimals(): number {
        return this.decimalInput ? this._decimals : 0;
    }

    private get decimalInput(): boolean {
        const control = this.checkboxControl;
        if (!control) {
            return false;
        }
        return control.value;
    }

    public resetAmount() {
        this.inputControl.reset(new BigNumber(0));
    }

    public step(): string {
        if (this.decimalInput) {
            return this.minimumAmount().toString();
        } else {
            return '1';
        }
    }

    minimumAmount(): string {
        return (1 / 10 ** this._decimals).toFixed(this._decimals);
    }

    convertFromDecimal() {
        const amount: BigNumber = this.inputControl.value;
        if (
            this.decimalInput &&
            BigNumber.isBigNumber(amount) &&
            amount.decimalPlaces() <= this._decimals
        ) {
            this.inputControl.setValue(
                amountFromDecimal(amount, this._decimals),
                { emitModelToViewChange: false }
            );
        }
    }

    onCheckChange(event: MatCheckboxChange) {
        const amount: BigNumber = this.inputControl.value;

        if (!BigNumber.isBigNumber(amount) || amount.isNaN()) {
            this.inputControl.setValue(new BigNumber(0));
        } else if (event.checked) {
            const decimalAmount = amountToDecimal(amount, this._decimals);
            this.amountInput.nativeElement.value = decimalAmount.toFixed(
                decimalAmount.decimalPlaces()
            );
        } else {
            if (amount.decimalPlaces() > 0) {
                this.inputControl.setValue(
                    amountFromDecimal(amount, this._decimals)
                );
            } else {
                this.amountInput.nativeElement.value = amount.toString();
            }
        }

        this.inputControl.markAsTouched();
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

    private updateCheckboxState() {
        if (this._decimals === 0) {
            this.checkboxControl.disable();
        } else {
            this.checkboxControl.enable();
        }
    }
}
