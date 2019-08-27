import { DecimalPipe } from './decimal.pipe';
import BigNumber from 'bignumber.js';

describe('DecimalPipe', () => {
    let pipe: DecimalPipe;

    beforeEach(() => {
        pipe = new DecimalPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should show 0 when the value is 0 with 8 decimals', () => {
        expect(pipe.transform(new BigNumber(0), 8)).toBe('0');
    });

    it('should show 0.00000001 when the value is 1 with 8 decimals', () => {
        expect(pipe.transform(new BigNumber(1), 8)).toBe('0.00000001');
    });

    it('should show 0.0000001 when the value is 10 with 8 decimals', () => {
        expect(pipe.transform(new BigNumber(10), 8)).toBe('0.0000001');
    });

    it('should show 0.1 when the value is 10000000 with 8 decimals', () => {
        expect(pipe.transform(new BigNumber(10000000), 8)).toBe('0.1');
    });

    it('should show 0.1 when the value is 10000000000000000 with 18 decimals', () => {
        expect(pipe.transform(new BigNumber(100000000000000000), 18)).toBe(
            '0.1'
        );
    });

    it('should show 0.000000000000000008 when the value is 8 with 18 decimals', function() {
        expect(pipe.transform(new BigNumber(8), 18)).toBe(
            '0.000000000000000008'
        );
    });
});
