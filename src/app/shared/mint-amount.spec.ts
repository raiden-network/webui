import { getMintAmount } from './mint-amount';
import BigNumber from 'bignumber.js';

describe('MintAmount', () => {
    it('should return 0.5 tokens when token has 18 decimals', () => {
        const mintAmount = getMintAmount(18);
        expect(mintAmount).toEqual(new BigNumber('500000000000000000'));
    });

    it('should return 5000 tokens when token has no decimals', () => {
        const mintAmount = getMintAmount(0);
        expect(mintAmount).toEqual(new BigNumber(5000));
    });
});
