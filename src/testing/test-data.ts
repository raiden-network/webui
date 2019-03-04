import { Address } from '../app/models/address';
import Web3 from 'web3';

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
