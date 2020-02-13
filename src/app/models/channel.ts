import { UserToken } from './usertoken';
import BigNumber from 'bignumber.js';

export interface Channel {
    channel_identifier: BigNumber;
    token_address: string;
    partner_address: string;
    state:
        | 'opened'
        | 'closed'
        | 'settled'
        | 'waiting_for_open'
        | 'waiting_for_close'
        | 'waiting_for_settle'
        | 'channel_unusable';
    total_deposit: BigNumber;
    total_withdraw: BigNumber;
    balance: BigNumber;
    settle_timeout: number;
    reveal_timeout: number;
    userToken?: UserToken;
    depositPending?: boolean;
}
