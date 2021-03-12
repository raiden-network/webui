import { amountFromDecimal } from 'app/utils/amount.converter';
import BigNumber from 'bignumber.js';

export function getMintAmount(tokenDecimals): BigNumber {
    const scaleFactor = tokenDecimals >= 18 ? 1 : tokenDecimals / 18;
    const amount = amountFromDecimal(new BigNumber(0.5), tokenDecimals)
        .times(scaleFactor)
        .plus(
            amountFromDecimal(new BigNumber(5000), tokenDecimals).times(
                1 - scaleFactor
            )
        )
        .integerValue();

    return amount;
}
