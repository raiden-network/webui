import BigNumber from 'bignumber.js';

export interface SwapToken {
    partner_address: string;
    identifier: string;
    role: string;
    sending_token: string;
    sending_amount: BigNumber;
    receiving_token: string;
    receiving_amount: BigNumber;
}
