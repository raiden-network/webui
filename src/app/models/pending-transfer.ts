import BigNumber from 'bignumber.js';

export interface PendingTransfer {
    readonly channel_identifier: BigNumber;
    readonly initiator: string;
    readonly locked_amount: BigNumber;
    readonly payment_identifier: BigNumber;
    readonly role: string;
    readonly target: string;
    readonly token_address: string;
    readonly token_network_address: string;
    readonly transferred_amount: BigNumber;
    notificationIdentifier?: number;
}
