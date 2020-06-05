import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';
import { amountToDecimal } from '../utils/amount.converter';

@Pipe({
    name: 'decimal',
})
export class DecimalPipe implements PipeTransform {
    transform(value: BigNumber, decimals: number): string {
        if (!value) {
            return '0';
        }
        const amount = amountToDecimal(value, decimals);
        return amount.toFixed();
    }
}
