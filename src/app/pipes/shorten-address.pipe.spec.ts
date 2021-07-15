import { ShortenAddressPipe } from './shorten-address.pipe';

describe('ShortenAddressPipe', () => {
    let pipe: ShortenAddressPipe;

    beforeEach(() => {
        pipe = new ShortenAddressPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return the same value if it is smaller than', function() {
        expect(pipe.transform('123')).toEqual('123');
    });

    it('should return the address truncated to 6 characters without touching the 0x prefix', function() {
        expect(pipe.transform('0x0123456789012345678901234567890123456789')).toEqual('0x012...789');
    });

    it('should return the value truncated', function() {
        expect(pipe.transform('12345678', 4)).toEqual('12...78');
    });

    it('should return an empty string if no value', function() {
        expect(pipe.transform(undefined)).toEqual('');
    });
});
