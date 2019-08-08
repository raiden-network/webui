import { BigNumberConversionDirective } from './big-number-conversion.directive';
import BigNumber from 'bignumber.js';
import { ElementRef } from '@angular/core';

describe('BigNumberConversionDirective', () => {
    let directive: BigNumberConversionDirective;
    let inputElement: HTMLInputElement;
    let controlValue: any;

    beforeEach(() => {
        inputElement = document.createElement('input');
        directive = new BigNumberConversionDirective(
            new ElementRef(inputElement)
        );
        controlValue = '';
        directive.registerOnChange(value => (controlValue = value));
    });

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('should write the converted value to control', () => {
        directive.convertInput('100');
        expect((<BigNumber>controlValue).isEqualTo(100)).toBe(true);
    });

    it('should write a BigNumber NaN for text input to control', () => {
        directive.convertInput('abc');
        expect((<BigNumber>controlValue).isNaN()).toBe(true);
    });

    it('should write to view', () => {
        directive.writeValue('0');
        expect(inputElement.value).toBe('0');
    });
});
