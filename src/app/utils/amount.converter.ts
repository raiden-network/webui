import BigNumber from 'bignumber.js';

export function amountFromDecimal(
    amount: BigNumber,
    decimals: number
): BigNumber {
    return amount.shiftedBy(decimals).integerValue();
}

export function amountToDecimal(
    amount: BigNumber,
    decimals: number
): BigNumber {
    return amount.shiftedBy(-decimals);
}
