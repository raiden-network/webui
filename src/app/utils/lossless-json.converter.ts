import BigNumber from 'bignumber.js';
import { LosslessNumber, parse, stringify } from 'lossless-json';

export function losslessParse(json: string): any {
    return parse(json, (key, value) => {
        if (value && value.isLosslessNumber) {
            return new BigNumber(value.toString());
        } else {
            return value;
        }
    });
}

export function losslessStringify(obj: any): string {
    return stringify(obj, (key, value) => {
        if (BigNumber.isBigNumber(value)) {
            return new LosslessNumber(value.toString());
        } else {
            return value;
        }
    });
}
