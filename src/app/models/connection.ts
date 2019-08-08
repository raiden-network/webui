import BigNumber from 'bignumber.js';

export interface Connection {
    funds: BigNumber;
    sum_deposits: BigNumber;
    channels: BigNumber;
}

export interface Connections {
    [address: string]: Connection;
}
