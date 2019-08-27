import { Injectable } from '@angular/core';
import { Contract } from 'web3-eth-contract';
import { UserToken } from '../models/usertoken';
import { RaidenConfig } from './raiden.config';
import { tokenabi } from './tokenabi';
import Web3 from 'web3';
import { BatchManager } from './batch-manager';
import BigNumber from 'bignumber.js';

@Injectable({
    providedIn: 'root'
})
export class TokenInfoRetrieverService {
    private readonly web3: Web3;
    private readonly tokenContract: Contract;
    private readonly batchManager: BatchManager;

    constructor(private raidenConfig: RaidenConfig) {
        this.web3 = this.raidenConfig.web3;
        this.tokenContract = new this.web3.eth.Contract(tokenabi);
        this.batchManager = this.raidenConfig.batchManager;
    }

    private static createToken(address: string): UserToken {
        return {
            address,
            name: '',
            symbol: '',
            decimals: 18,
            balance: new BigNumber(0)
        };
    }

    async createBatch(
        tokenAddresses: string[],
        raidenAddress: string,
        userTokens: { [address: string]: UserToken | null }
    ): Promise<{ [address: string]: UserToken }> {
        const batchManager = this.batchManager;

        const map: {
            [index: number]: { method: string; address: string };
        } = {};

        function add(
            methods,
            nameProperty: string,
            tokenAddress: string,
            defaultValue?: any
        ) {
            const index = batchManager.add({
                request: methods[nameProperty]().call.request(),
                defaultValue: defaultValue
            });

            map[index - 1] = {
                method: nameProperty,
                address: tokenAddress
            };
        }

        tokenAddresses.forEach(tokenAddress => {
            const contract = this.tokenContract;
            contract.options.address = tokenAddress;

            const methods = contract.methods;

            if (!userTokens[tokenAddress]) {
                add(methods, 'name', tokenAddress, '');
                add(methods, 'symbol', tokenAddress, '');
                add(methods, 'decimals', tokenAddress, 18);
            }

            const request = methods.balanceOf(raidenAddress).call.request();

            const balanceIndex = this.batchManager.add({
                request: request
            });

            map[balanceIndex - 1] = {
                method: 'balanceOf',
                address: tokenAddress
            };
        });

        const results = await this.batchManager.execute();

        results.forEach((value, index) => {
            const element = map[index];

            if (!element) {
                throw Error(`could not find element for index ${index}`);
            }

            let token: UserToken = userTokens[element.address];
            if (!token) {
                token = TokenInfoRetrieverService.createToken(element.address);
            }

            const method =
                element.method !== 'balanceOf' ? element.method : 'balance';
            const expectedType = typeof token[method];

            if (typeof value === 'object') {
                if (value._ethersType !== 'BigNumber') {
                    value = value[method] || value['0'];
                }
            }

            if (expectedType === 'number') {
                value = Number(value);
            } else if (BigNumber.isBigNumber(token[method])) {
                value = new BigNumber(value);
            }

            token[method] = value;
            userTokens[element.address] = token;
        });

        return userTokens;
    }
}
