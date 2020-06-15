import { UserToken } from '../models/usertoken';
import { amountToDecimal } from './amount.converter';

export class TokenUtils {
    static compareTokens(
        a: UserToken,
        b: UserToken,
        aUsage: number,
        bUsage: number
    ): number {
        const aConnected = a.connected && a.sumChannelBalances;
        const bConnected = b.connected && b.sumChannelBalances;
        if (aUsage !== bUsage) {
            return bUsage - aUsage;
        } else if (aConnected && bConnected) {
            return amountToDecimal(b.sumChannelBalances, b.decimals)
                .minus(amountToDecimal(a.sumChannelBalances, a.decimals))
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
