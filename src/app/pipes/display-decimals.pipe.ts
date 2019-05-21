import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';

@Pipe({
    name: 'displayDecimals'
})
export class DisplayDecimalsPipe implements PipeTransform {
    transform(value?: string, maxDecimals: number = 4): string {
        if (!value) {
            return '';
        }

        const bn = new BigNumber(value);

        if (bn.isZero()) {
            return '0.0';
        } else if (bn.isLessThan(0.00001)) {
            return '<0.00001';
        } else {
            const splitted = value.split('.');
            if (splitted[1] && splitted[1].length > 5) {
                return value.substr(0, value.indexOf('.') + 6);
            } else {
                return value;
            }
        }
    }
}
