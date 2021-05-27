import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    forwardRef,
    ViewChild,
} from '@angular/core';
import {
    ControlValueAccessor,
    AbstractControl,
    ValidationErrors,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
    Validator,
} from '@angular/forms';
import BigNumber from 'bignumber.js';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-payment-identifier-input',
    templateUrl: './payment-identifier-input.component.html',
    styleUrls: ['./payment-identifier-input.component.scss'],
    animations: [...Animations.fallDown, ...Animations.stretchInOut],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PaymentIdentifierInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PaymentIdentifierInputComponent),
            multi: true,
        },
    ],
})
export class PaymentIdentifierInputComponent
    implements ControlValueAccessor, Validator
{
    @ViewChild('input', { static: false }) private inputElement: ElementRef;

    identifier: BigNumber;
    errors: ValidationErrors;
    touched = false;
    showInputField = false;

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

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
        if (!this.showInputField) {
            this.showInputField = true;
            this.changeDetectorRef.detectChanges();
        }
        this.inputElement.nativeElement.value = obj;
        this.onChange();
    }

    validate(c: AbstractControl): ValidationErrors | null {
        return this.errors;
    }

    onChange() {
        const value = this.inputElement?.nativeElement.value;
        this.identifier = new BigNumber(value);

        if (!value) {
            this.errors = undefined;
        } else if (
            !BigNumber.isBigNumber(this.identifier) ||
            this.identifier.isNaN()
        ) {
            this.errors = {
                notANumber: true,
            };
        } else if (this.identifier.isNegative()) {
            this.errors = {
                negativeIdentifier: true,
            };
        } else if (this.identifier.decimalPlaces() > 0) {
            this.errors = {
                decimalValue: true,
            };
        } else {
            this.errors = undefined;
        }

        this.propagateChange(this.identifier);
    }

    onTouched() {
        this.touched = true;
        this.propagateTouched();
    }

    toggleInputField() {
        if (this.showInputField) {
            this.inputElement.nativeElement.value = '';
        }
        this.showInputField = !this.showInputField;
        this.onChange();
    }

    /* istanbul ignore next */
    clipboardApiSupported() {
        return window.navigator.clipboard?.readText;
    }

    /* istanbul ignore next */
    async onPaste() {
        const value = await window.navigator.clipboard.readText();
        this.inputElement.nativeElement.value = value;
        this.onChange();
        this.onTouched();
    }

    private propagateTouched = () => {};
    private propagateChange = (identifier: BigNumber) => {};
}
