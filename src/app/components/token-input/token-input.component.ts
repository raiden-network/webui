import {
    Component,
    forwardRef,
    Input,
    ViewChild,
    ElementRef,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    Validator,
    ValidationErrors,
    NG_VALIDATORS,
} from '@angular/forms';
import { BigNumber } from 'bignumber.js';
import {
    amountFromDecimal,
    amountToDecimal,
} from '../../utils/amount.converter';
import { UserToken } from '../../models/usertoken';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-token-input',
    templateUrl: './token-input.component.html',
    styleUrls: ['./token-input.component.scss'],
    animations: Animations.fallDown,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TokenInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TokenInputComponent),
            multi: true,
        },
    ],
})
export class TokenInputComponent implements ControlValueAccessor, Validator {
    @Input() allowZero = false;
    @Input() infoText = '';
    @Input() placeholder = 'Amount';
    @Input() width = '226';
    @Input() showInfoBox = true;
    @Input() onChainInput = false;
    @Input() showTransferLimit = false;
    @ViewChild('input', { static: true }) private inputElement: ElementRef;

    amount: BigNumber;
    errors: ValidationErrors = { empty: true };
    touched = false;
    disabled = false;

    private _selectedToken: UserToken;
    private _maxAmount: BigNumber;
    private propagateTouched = () => {};
    private propagateChange = (amount: BigNumber) => {};

    constructor() {}

    get decimals(): number {
        return this._selectedToken ? this._selectedToken.decimals : 0;
    }

    get selectedToken(): UserToken {
        return this._selectedToken;
    }

    get maxAmount(): BigNumber {
        return this._maxAmount;
    }

    set selectedToken(value: UserToken) {
        this._selectedToken = value;
        this.setAmount();
    }

    set maxAmount(value: BigNumber) {
        this._maxAmount = value;
        this.setAmount();
    }

    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    writeValue(obj: any) {
        if (!obj) {
            return;
        } else if (typeof obj === 'string') {
            this.inputElement.nativeElement.value = obj;
            this.onChange();
        } else if (BigNumber.isBigNumber(obj)) {
            const value = amountToDecimal(obj, this.decimals).toFixed();
            this.inputElement.nativeElement.value = value;
            this.onChange();
        }
    }

    validate(c: AbstractControl): ValidationErrors | null {
        return this.errors;
    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    onChange() {
        this.setAmount();
    }

    onTouched() {
        this.touched = true;
        this.propagateTouched();
    }

    setAmountToMax() {
        const max = amountToDecimal(this.maxAmount, this.decimals).toFixed();
        this.inputElement.nativeElement.value = max;
        this.onTouched();
        this.onChange();
    }

    isLessThanThreshold(): boolean {
        return !!this.selectedToken?.transferThreshold?.isGreaterThan(
            this.amount
        );
    }

    formattedThreshold(): string {
        return amountToDecimal(
            this.selectedToken.transferThreshold,
            this.decimals
        ).toFixed();
    }

    private setAmount() {
        const decimalAmount = new BigNumber(
            this.inputElement.nativeElement.value
        );
        const amount = amountFromDecimal(decimalAmount, this.decimals);

        if (!BigNumber.isBigNumber(decimalAmount) || decimalAmount.isNaN()) {
            this.errors = {
                notANumber: true,
            };
        } else if (!this.allowZero && decimalAmount.isZero()) {
            this.errors = {
                zeroAmount: true,
            };
        } else if (decimalAmount.decimalPlaces() > this.decimals) {
            this.errors = {
                tooManyDecimals: true,
            };
        } else if (this.maxAmount && amount.isGreaterThan(this.maxAmount)) {
            this.errors = {
                insufficientFunds: true,
            };
        } else if (amount.isNegative()) {
            this.errors = {
                negativeAmount: true,
            };
        } else {
            this.errors = undefined;
        }

        this.amount = amount;
        this.propagateChange(this.amount);
    }
}
