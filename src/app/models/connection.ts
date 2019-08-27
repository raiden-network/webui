import BigNumber from 'bignumber.js';

export interface Connection {
    funds: BigNumber;
    sum_deposits: BigNumber;
    channels: number;
}

export interface Connections {
    [address: string]: Connection;
}
