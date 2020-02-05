import { Contact } from '../app/models/contact';
import Web3 from 'web3';
import { Channel } from '../app/models/channel';
import BigNumber from 'bignumber.js';
import { Network } from '../app/utils/network-info';
import { UserToken } from '../app/models/usertoken';

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
            label: `Random Account ${i + 1}`
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
        balance: new BigNumber(100)
    };
    return Object.assign(token, obj);
}

export function createTestTokens(count: number = 3): UserToken[] {
    const tokens: UserToken[] = [];
    for (let i = 0; i < count; i++) {
        let connected;
        if (i % 2 === 0) {
            connected = {
                channels: 1,
                funds: new BigNumber(0),
                sum_deposits: new BigNumber(0)
            };
        }
        tokens.push(
            createToken({
                address: createAddress(),
                symbol: `TST ${i + 1}`,
                name: `Test Suite Token ${i + 1}`,
                connected: connected
            })
        );
    }
    return tokens;
}

export function createChannel(obj: any = {}): Channel {
    const channel: Channel = {
        state: 'opened',
        channel_identifier: BigNumber.random(2).times(100),
        token_address: obj.userToken
            ? obj.userToken.address
            : '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: createAddress(),
        reveal_timeout: 50,
        balance: new BigNumber(0),
        total_deposit: new BigNumber(0),
        total_withdraw: new BigNumber(0),
        settle_timeout: 500,
        userToken: undefined
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
                balance: BigNumber.random(3).times(1000)
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
        ensSupported: false,
        faucet: 'http://faucet.test/?${ADDRESS}'
    };
    return Object.assign(network, obj);
}
