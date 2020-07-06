import { Contact } from '../app/models/contact';
import Web3 from 'web3';
import { Channel } from '../app/models/channel';
import BigNumber from 'bignumber.js';
import { Network } from '../app/utils/network-info';
import { UserToken } from '../app/models/usertoken';
import { PaymentEvent } from '../app/models/payment-event';
import { PendingTransfer } from '../app/models/pending-transfer';
import { ContractsInfo } from '../app/models/contracts-info';
import { Connection } from '../app/models/connection';

const web3 = new Web3('http://localhost:8545');

export function createAddress(): string {
    return web3.eth.accounts.create(web3.utils.randomHex(32)).address;
}

export function createTestContacts(count: number = 15): Contact[] {
    const contacts: Contact[] = [];

    for (let i = 0; i < count; i++) {
        const address = createAddress();
        contacts.push({
            address: address,
            label: `Random Account ${i + 1}`,
        });
    }

    return contacts;
}

export function createToken(obj: any = {}): UserToken {
    const token: UserToken = {
        address: createAddress(),
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(100),
    };
    return Object.assign(token, obj);
}

export function createTestTokens(count: number = 3): UserToken[] {
    const tokens: UserToken[] = [];
    for (let i = 0; i < count; i++) {
        let connected: Connection;
        if (i % 2 === 0) {
            connected = {
                channels: 1,
                funds: new BigNumber(0),
                sum_deposits: new BigNumber(0),
            };
        }
        tokens.push(
            createToken({
                address: createAddress(),
                symbol: `TST ${i + 1}`,
                name: `Test Suite Token ${i + 1}`,
                connected: connected,
            })
        );
    }
    return tokens;
}

export function createChannel(obj: any = {}): Channel {
    const channel: Channel = {
        state: 'opened',
        channel_identifier: BigNumber.random(2).times(100),
        token_address: obj.userToken ? obj.userToken.address : createAddress(),
        partner_address: createAddress(),
        reveal_timeout: 50,
        balance: BigNumber.random(3).times(1000),
        total_deposit: new BigNumber(0),
        total_withdraw: new BigNumber(0),
        settle_timeout: 500,
    };
    return Object.assign(channel, obj);
}

export function createTestChannels(
    count: number = 3,
    token?: UserToken
): Channel[] {
    const channels: Channel[] = [];
    const userToken = token ? token : createToken();
    for (let i = 0; i < count; i++) {
        channels.push(
            createChannel({
                userToken: userToken,
            })
        );
    }
    return channels;
}

export function createNetworkMock(obj: any = {}): Network {
    const network: Network = {
        name: 'Test',
        shortName: 'tst',
        chainId: 9001,
        ensSupported: true,
        faucet: 'http://faucet.test/?${ADDRESS}',
    };
    return Object.assign(network, obj);
}

export function createPaymentEvent(
    eventType:
        | 'EventPaymentSentSuccess'
        | 'EventPaymentSentFailed'
        | 'EventPaymentReceivedSuccess',
    obj: any = {}
): PaymentEvent {
    const event: PaymentEvent = {
        event: eventType,
        log_time: new Date().toISOString().slice(0, -1),
        token_address: createAddress(),
    };
    if (eventType === 'EventPaymentSentSuccess') {
        Object.assign(event, {
            amount: BigNumber.random(3).times(1000),
            identifier: BigNumber.random(3).times(1000),
            target: createAddress(),
        });
    } else if (eventType === 'EventPaymentReceivedSuccess') {
        Object.assign(event, {
            amount: BigNumber.random(3).times(1000),
            identifier: BigNumber.random(3).times(1000),
            initiator: createAddress(),
        });
    } else {
        Object.assign(event, {
            reason: 'there is no route available',
            target: createAddress(),
        });
    }

    return Object.assign(event, obj);
}

export function createTestPaymentEvents(
    count: number = 6,
    token?: UserToken
): PaymentEvent[] {
    const events: PaymentEvent[] = [];
    const userToken = token ? token : createToken();
    for (let i = 0; i < count; i++) {
        const type =
            i % 2 === 0
                ? 'EventPaymentSentSuccess'
                : 'EventPaymentReceivedSuccess';
        events.push(
            createPaymentEvent(type, {
                userToken: userToken,
            })
        );
    }
    return events;
}

export function createPendingTransfer(obj: any = {}): PendingTransfer {
    const pendingTransfer: PendingTransfer = {
        channel_identifier: BigNumber.random(2).times(100),
        initiator: createAddress(),
        locked_amount: new BigNumber(100),
        payment_identifier: BigNumber.random(3).times(1000),
        role: 'initiator',
        target: createAddress(),
        token_address: obj.userToken ? obj.userToken.address : createAddress(),
        token_network_address: createAddress(),
        transferred_amount: new BigNumber(0),
    };
    return Object.assign(pendingTransfer, obj);
}

export function createContractsInfo(obj: any = {}): ContractsInfo {
    const contracts: ContractsInfo = {
        contracts_version: '0.37.0',
        token_network_registry_address: createAddress(),
        secret_registry_address: createAddress(),
        service_registry_address: createAddress(),
        user_deposit_address: createAddress(),
        monitoring_service_address: createAddress(),
        one_to_n_address: createAddress(),
    };
    return Object.assign(contracts, obj);
}
