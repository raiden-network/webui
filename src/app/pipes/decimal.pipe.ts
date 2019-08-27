import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';
import { amountToDecimal } from '../utils/amount.converter';

@Pipe({
    name: 'decimal'
})
export class DecimalPipe implements PipeTransform {
    transform(value: BigNumber, decimals: number): string {
        BigNumber.config({ DECIMAL_PLACES: decimals });
        const amount = amountToDecimal(value, decimals);
        return amount.toFixed();
    }
}
