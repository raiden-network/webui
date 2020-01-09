import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';

@Pipe({
    name: 'displayDecimals'
})
export class DisplayDecimalsPipe implements PipeTransform {
    transform(
        value?: string,
        maxDecimals: number = 5,
        shortVersion: boolean = true
    ): string {
        if (!value) {
            return '';
        }

        const bn = new BigNumber(value);

        if (bn.isLessThan(0.00001) && !bn.isZero()) {
            return '<0.00001';
        } else {
            const splitted = value.split('.');
            if (splitted[1] && splitted[1].length > maxDecimals) {
                const suffix =
                    maxDecimals !== 0 && !shortVersion ? '[...]' : '';
                return (
                    (!shortVersion ? '~' : '') +
                    bn.toFixed(maxDecimals, BigNumber.ROUND_FLOOR) +
                    suffix
                );
            } else {
                return value;
            }
        }
    }
}
