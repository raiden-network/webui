import { Injectable } from '@angular/core';
import { UserToken } from '../models/usertoken';
import { RaidenConfig } from './raiden.config';
import { tokenabi } from '../models/tokenabi';
import BigNumber from 'bignumber.js';
import { BatchManager } from './batch-manager';
import { provider } from 'web3-core';

@Injectable({
    providedIn: 'root',
})
export class BatchManagerFactory {
    create(web3Provider: provider): BatchManager {
        return new BatchManager(web3Provider);
    }
}

@Injectable({
    providedIn: 'root',
})
export class TokenInfoRetrieverService {
    constructor(
        private raidenConfig: RaidenConfig,
        private batchManagerFactory: BatchManagerFactory
    ) {}

    private static createToken(address: string): UserToken {
        return {
            address,
            name: '',
            symbol: '',
            decimals: 18,
            balance: new BigNumber(0),
        };
    }

    async createBatch(
        tokenAddresses: string[],
        raidenAddress: string,
        userTokens: { [address: string]: UserToken | null }
    ): Promise<{ [address: string]: UserToken }> {
        const batchManager = this.batchManagerFactory.create(
            this.raidenConfig.web3.currentProvider
        );

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
                defaultValue: defaultValue,
            });

            map[index - 1] = {
                method: nameProperty,
                address: tokenAddress,
            };
        }

        tokenAddresses.forEach((tokenAddress) => {
            const contract = new this.raidenConfig.web3.eth.Contract(tokenabi);
            contract.options.address = tokenAddress;

            const methods = contract.methods;

            if (!userTokens[tokenAddress]) {
                add(methods, 'name', tokenAddress, '');
                add(methods, 'symbol', tokenAddress, '');
                add(methods, 'decimals', tokenAddress, 18);
            }

            const request = methods.balanceOf(raidenAddress).call.request();

            const balanceIndex = batchManager.add({
                request: request,
            });

            map[balanceIndex - 1] = {
                method: 'balanceOf',
                address: tokenAddress,
            };
        });

        const results = await batchManager.execute();

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
