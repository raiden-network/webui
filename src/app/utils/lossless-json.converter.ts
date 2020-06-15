import BigNumber from 'bignumber.js';

export function losslessParse(json: string): any {
    const numberRegex = /^\d+$/;
    return JSON.parse(json, (key, value) =>
        (typeof value === 'string' && numberRegex.test(value)) ||
        typeof value === 'number'
            ? new BigNumber(value)
            : value
    );
}

export function losslessStringify(obj: any): string {
    return JSON.stringify(obj, function (key, value) {
        if (BigNumber.isBigNumber(this[key])) {
            return this[key].toFixed();
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        return value;
    });
}
