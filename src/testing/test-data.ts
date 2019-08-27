import { Address } from '../app/models/address';
import Web3 from 'web3';
import { Channel } from '../app/models/channel';
import BigNumber from 'bignumber.js';

export function createTestAddresses(count: number = 15): Address[] {
    const web3 = new Web3('http://localhost:8545');
    const addresses: Address[] = [];

    for (let i = 0; i < count; i++) {
        const account = web3.eth.accounts.create(web3.utils.randomHex(32));
        addresses.push({
            address: account.address,
            label: `Random Account ${i + 1}`
        });
    }

    return addresses;
}

export const createChannel: (payload: {
    id: BigNumber;
    balance: BigNumber;
    totalDeposit: BigNumber;
    totalWithdraw: BigNumber;
}) => Channel = (payload: {
    id: BigNumber;
    balance: BigNumber;
    totalDeposit: BigNumber;
    totalWithdraw: BigNumber;
}) => ({
    state: 'opened',
    channel_identifier: payload.id,
    token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
    partner_address: '0xFC57d325f23b9121a8488fFdE2E6b3ef1208a20b',
    reveal_timeout: 600,
    balance: payload.balance,
    total_deposit: payload.totalDeposit,
    total_withdraw: payload.totalWithdraw,
    settle_timeout: 500,
    userToken: null
});
