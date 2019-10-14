import { UserToken } from './usertoken';
import BigNumber from 'bignumber.js';

export interface Channel {
    channel_identifier: BigNumber;
    token_address: string;
    partner_address: string;
    state: string;
    total_deposit: BigNumber;
    total_withdraw: BigNumber;
    balance: BigNumber;
    settle_timeout: number;
    reveal_timeout: number;
    userToken?: UserToken;
}
