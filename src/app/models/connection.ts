import BigNumber from 'bignumber.js';

export interface Connection {
    sum_deposits: BigNumber;
    channels: number;
}

export interface Connections {
    [address: string]: Connection;
}

export interface ConnectionChoice {
    readonly partnerAddress: string;
    readonly deposit: BigNumber;
}

export interface SuggestedConnection {
    readonly address: string;
    readonly score: BigNumber;
    readonly centrality: BigNumber;
    readonly uptime: BigNumber;
    readonly capacity: BigNumber;
}
