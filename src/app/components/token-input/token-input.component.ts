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
    NG_VALUE_ACCESSOR,
    Validator,
    ValidationErrors,
    NG_VALIDATORS
} from '@angular/forms';
import { BigNumber } from 'bignumber.js';
import { amountFromDecimal } from '../../utils/amount.converter';
import { UserToken } from '../../models/usertoken';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-token-input',
    templateUrl: './token-input.component.html',
    styleUrls: ['./token-input.component.css'],
    animations: Animations.fallDown,
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
    @Input() allowZero = false;
    @Input() infoText = '';
    @Input() placeholder = 'Amount';
    @ViewChild('input', { static: true }) private inputElement: ElementRef;

    token: UserToken;
    amount: BigNumber;
    errors: ValidationErrors = { empty: true };
    touched = false;

    private propagateTouched = () => {};
    private propagateChange = (amount: BigNumber) => {};

    constructor() {}

    get decimals(): number {
        return this.token ? this.token.decimals : 0;
    }

    set selectedToken(value: UserToken) {
        this.token = value;
        this.setAmount();
    }

    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    writeValue(obj: any) {
        if (!obj || typeof obj !== 'string') {
            return;
        }
        this.inputElement.nativeElement.value = obj;
        this.onChange();
    }

    validate(c: AbstractControl): ValidationErrors | null {
        return this.errors;
    }

    onChange() {
        this.setAmount();
    }

    onTouched() {
        this.touched = true;
        this.propagateTouched();
    }

    private setAmount() {
        const amount = new BigNumber(this.inputElement.nativeElement.value);
        if (!BigNumber.isBigNumber(amount) || amount.isNaN()) {
            this.errors = {
                notANumber: true
            };
        } else if (!this.allowZero && amount.isZero()) {
            this.errors = {
                zeroAmount: true
            };
        } else if (amount.decimalPlaces() > this.decimals) {
            this.errors = {
                tooManyDecimals: true
            };
        } else {
            this.errors = undefined;
        }

        this.amount = amountFromDecimal(amount, this.decimals);
        this.propagateChange(this.amount);
    }
}
