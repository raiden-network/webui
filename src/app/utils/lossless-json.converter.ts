import BigNumber from 'bignumber.js';

export function losslessParse(json: string): any {
    const numberRegex = /^\d+$/;
    const obj = JSON.parse(json, (key, value) =>
        (typeof value === 'string' && numberRegex.test(value)) ||
        typeof value === 'number'
            ? new BigNumber(value)
            : value
    );
    return obj;
}

export function losslessStringify(obj: any): string {
    const str = JSON.stringify(obj, (key, value) =>
        BigNumber.isBigNumber(value) || typeof value === 'number'
            ? value.toString()
            : value
    );
    return str;
}
