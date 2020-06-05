import { Connection } from './connection';
import BigNumber from 'bignumber.js';

export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
}

export interface UserToken extends TokenInfo {
    balance: BigNumber;
    connected?: Connection;
    sumChannelBalances?: BigNumber;
}
