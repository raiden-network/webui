import { losslessStringify, losslessParse } from './lossless-json.converter';
import BigNumber from 'bignumber.js';

describe('LosslessJsonConverter', () => {
    it('should parse to BigNumbers', () => {
        const parsed = losslessParse(
            '{"big":"18446744073709551616","text":"Hello"}'
        );
        expect(BigNumber.isBigNumber(parsed.big)).toBe(true);
        expect(parsed.big).toEqual(new BigNumber('18446744073709551616'));
        expect(parsed.text).toBe('Hello');
    });

    it('should stringify BigNumbers', () => {
        const stringified = losslessStringify({
            big: new BigNumber('18446744073709551616'),
            text: 'Hello',
        });
        expect(stringified).toBe(
            '{"big":"18446744073709551616","text":"Hello"}'
        );
    });

    it('should not use exponential notation', () => {
        const stringified = losslessStringify({
            big: new BigNumber('10000000000000000000000'),
            text: 'Hello',
        });
        expect(stringified).toBe(
            '{"big":"10000000000000000000000","text":"Hello"}'
        );
    });

    it('should stringify normal numbers', () => {
        const stringified = losslessStringify({
            number: 100,
            text: 'Hello',
        });
        expect(stringified).toBe('{"number":"100","text":"Hello"}');
    });

    it('should parse decimals to BigNumbers', () => {
        const parsed = losslessParse('{"big":"21.201"}');
        expect(BigNumber.isBigNumber(parsed.big)).toBe(true);
        expect(parsed.big).toEqual(new BigNumber('21.201'));
    });
});
