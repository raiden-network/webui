import { DisplayDecimalsPipe } from './display-decimals.pipe';

describe('DisplayDecimalsPipe', () => {
    let pipe: DisplayDecimalsPipe;

    beforeEach(() => {
        pipe = new DisplayDecimalsPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return empty string on undefined', function () {
        expect(pipe.transform(undefined)).toEqual('');
    });

    it('should display a smaller icon if the amount is less than 0.00001', function () {
        expect(pipe.transform('0.0000010112345')).toEqual('<0.00001');
    });

    it('should display 0.00001 if the amount is 0.00001', function () {
        expect(pipe.transform('0.00001')).toEqual('0.00001');
    });

    it('should display the amount cutoff at 5 decimal points', function () {
        expect(pipe.transform('0.0011111111111')).toEqual('0.00111');
    });

    it('should display the amount cutoff at the passed decimal point', function () {
        expect(pipe.transform('0.0011111111111', 3)).toEqual('0.001');
    });

    it('should display the amount cutoff with dots when shortVersion is set false', function () {
        expect(pipe.transform('0.0011111111111', 3, false)).toEqual(
            '~0.001[...]'
        );
    });

    it('should display an integer when 0 decimal points passed', function () {
        expect(pipe.transform('1000.9', 0)).toEqual('1000');
    });

    it('should return the number formatted as it is if not enough decimals', function () {
        expect(pipe.transform('11.1')).toEqual('11.1');
    });

    it('display zero if deposit is zero', () => {
        expect(pipe.transform('0')).toEqual('0');
    });
});
