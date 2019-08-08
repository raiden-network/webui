import { Directive, forwardRef, ElementRef, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import BigNumber from 'bignumber.js';

@Directive({
    selector: '[convertToBigNumber]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BigNumberConversionDirective),
            multi: true
        }
    ]
})
export class BigNumberConversionDirective implements ControlValueAccessor {
    private writeToForm: (value: any) => void;

    constructor(private element: ElementRef) {}

    @HostListener('input', ['$event.target.value'])
    convertInput(value): void {
        this.writeToForm(new BigNumber(value));
    }

    registerOnChange(fn: (value: any) => void): void {
        this.writeToForm = fn;
    }

    registerOnTouched(fn: any): void {}

    writeValue(value: any): void {
        this.element.nativeElement.value = value;
    }
}
