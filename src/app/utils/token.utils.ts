import { UserToken } from '../models/usertoken';
import { amountToDecimal } from './amount.converter';

export class TokenUtils {
    static compareTokens(a: UserToken, b: UserToken): number {
        const aConnected = !!a.connected;
        const bConnected = !!b.connected;
        if (aConnected && bConnected) {
            return amountToDecimal(b.connected.sum_deposits, b.decimals)
                .minus(amountToDecimal(a.connected.sum_deposits, a.decimals))
                .toNumber();
        } else if (!aConnected && !bConnected) {
            return amountToDecimal(b.balance, b.decimals)
                .minus(amountToDecimal(a.balance, a.decimals))
                .toNumber();
        } else {
            return aConnected ? -1 : 1;
        }
    }
}
