import { amountFromDecimal, amountToDecimal } from './amount.converter';
import BigNumber from 'bignumber.js';

describe('AmountConverter', () => {
    it('should convert from decimal to int', function () {
        expect(amountFromDecimal(new BigNumber(0.00000001), 8)).toEqual(
            new BigNumber(1)
        );
        expect(amountFromDecimal(new BigNumber(0.0000042), 8)).toEqual(
            new BigNumber(420)
        );
        expect(amountFromDecimal(new BigNumber(0.00003), 8)).toEqual(
            new BigNumber(3000)
        );
        expect(
            amountFromDecimal(new BigNumber(0.000000000000000001), 18)
        ).toEqual(new BigNumber(1));
        expect(
            amountFromDecimal(new BigNumber(0.000000000000003111), 18)
        ).toEqual(new BigNumber(3111));
    });

    it('should convert from int to decimal', function () {
        expect(amountToDecimal(new BigNumber(1), 8)).toEqual(
            new BigNumber(0.00000001)
        );
        expect(amountToDecimal(new BigNumber(420), 8)).toEqual(
            new BigNumber(0.0000042)
        );
        expect(amountToDecimal(new BigNumber(3000), 8)).toEqual(
            new BigNumber(0.00003)
        );
        expect(amountToDecimal(new BigNumber(3111), 18)).toEqual(
            new BigNumber(0.000000000000003111)
        );
        expect(amountToDecimal(new BigNumber(1), 18)).toEqual(
            new BigNumber(0.000000000000000001)
        );
    });
});
