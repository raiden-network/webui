import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import Contract from 'web3/eth/contract';
import { UserToken } from '../models/usertoken';
import { RaidenConfig } from './raiden.config';
import { CallbackFunc } from './raiden.service';
import { tokenabi } from './tokenabi';
// @ts-ignore
import * as Web3 from 'web3';

function override(object, methodName, callback) {
    object[methodName] = callback(object[methodName]);
}

@Injectable({
    providedIn: 'root'
})
export class TokenInfoRetrieverService {
    private tokenContract: Contract;
    private readonly web3: Web3;

    constructor(private raidenConfig: RaidenConfig) {
        this.web3 = this.raidenConfig.web3;
        this.tokenContract = new this.web3.eth.Contract(tokenabi) as Contract;
    }

    createBatch(
        tokenAddresses: string[],
        raidenAddress: string
    ): Promise<{ [address: string]: UserToken }> {
        const web3 = this.web3;

        const userTokens: { [address: string]: UserToken } = {};

        return new Promise<{ [address: string]: UserToken }>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`timeout after 60000 ms`)), 60000);
            let done = false;
            try {
                let unprocessed = 0;

                const pending = function () {
                    unprocessed += 1;
                };

                const complete = function () {
                    clearTimeout(timeout);
                    unprocessed -= 1;
                    if (done && unprocessed === 0) {
                        resolve(userTokens);
                    }
                };

                let batch = new web3.BatchRequest();

                tokenAddresses.forEach(tokenAddress => {
                    batch = this.addTokenToBatch(tokenAddress, raidenAddress, userTokens, batch, pending, complete);
                    // @ts-ignore
                    if (batch.requests.length >= 800) {
                        batch.execute();
                        batch = new web3.BatchRequest();
                    }
                });

                done = true;

                // @ts-ignore
                if (batch.requests.length > 0) {
                    batch.execute();
                }
            } catch (e) {
                reject(e);
            }
        });

    }

    private createToken(address: string): UserToken {
        return {
            address,
            name: '',
            symbol: '',
            decimals: 18,
            balance: 0
        };
    }

    private addTokenToBatch(
        tokenAddress: string,
        raidenAddress: string,
        tokens: { [address: string]: UserToken | null },
        batch,
        pending: () => void,
        complete: () => void
    ) {
        this.tokenContract.options.address = tokenAddress;
        const contract = this.tokenContract;

        const updateValue = (property: string, defaultValue: any, error: Error, result: any) => {
            if (error && error.message && error.message.startsWith('Invalid JSON RPC response')) {
                throw error;
            }
            complete();
            let token = tokens[tokenAddress];
            let value: any;

            if (error) {
                console.error(error);
                value = defaultValue;
            } else {
                if (result instanceof BigNumber) {
                    value = (result as BigNumber).toNumber();
                } else {
                    value = result;
                }
            }

            if (!token) {
                token = this.createToken(tokenAddress);
            }

            token[property] = value;
            tokens[tokenAddress] = token;
        };

        const balanceMethod = contract.methods.balanceOf;
        if (balanceMethod) {
            const callback: CallbackFunc = (error: Error, result: any) => updateValue('balance', 0, error, result);
            // @ts-ignore
            const request = balanceMethod(raidenAddress).call.request(callback);
            batch.add(request);
            pending();
        }

        if (!tokens[tokenAddress]) {

            const addRequest = (property, defaultResponse) => {
                const callback: CallbackFunc = ((error: Error, result: any) => updateValue(property, defaultResponse, error, result));
                const method = contract.methods[property];
                if (method) {
                    // @ts-ignore
                    const request = method().call.request(callback);
                    this.monkeyPatchRequest(request, defaultResponse);
                    batch.add(request);
                    pending();
                }
            };


            addRequest('decimals', 18);
            addRequest('name', '');
            addRequest('symbol', '');
        }

        return batch;
    }

    private monkeyPatchRequest(request: any, defaultResponse: any): void {
        override(request, 'format', function (original) {
            return function (output) {
                let result: any;
                try {
                    result = original(output);
                } catch (e) {
                    if (e && e.message && e.message.startsWith('Invalid JSON RPC response')) {
                        throw e;
                    }
                    console.error(e);
                    result = defaultResponse;
                }
                return result;
            };
        });
    }
}
