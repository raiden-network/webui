import { Connection } from './connection';
import BigNumber from 'bignumber.js';

export interface UserToken {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: BigNumber;
    connected?: Connection;
    sumChannelBalances?: BigNumber;
}
