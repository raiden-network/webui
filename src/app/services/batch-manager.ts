import { AbstractWeb3Module } from 'web3-core';
import { AbstractMethod } from 'web3-core-method/types';
import { isObject } from 'rxjs/internal-compatibility';

export interface BatchRequest {
    readonly request: AbstractMethod;
    readonly defaultValue?: any;
}

export class Validator {
    static validate(response, payload?: object) {
        if (isObject(response)) {
            if (response.error) {
                if (response.error instanceof Error) {
                    return new Error(`Node error: ${response.error.message}`);
                }

                return new Error(
                    `Node error: ${JSON.stringify(response.error)}`
                );
            }

            if (payload && response.id !== payload['id']) {
                return new Error(
                    `Validation error: Invalid JSON-RPC response ID (request: ${
                        payload['id']
                    } / response: ${response.id})`
                );
            }

            if (response.result === undefined) {
                return new Error('Validation error: Undefined JSON-RPC result');
            }

            return true;
        }

        return new Error('Validation error: Response should be of type Object');
    }
}

export class BatchManager {
    constructor(moduleInstance: AbstractWeb3Module) {
        this.moduleInstance = moduleInstance;
    }
    private static BATCH_LIMIT = 800;

    private requests: Array<BatchRequest> = [];
    private moduleInstance: AbstractWeb3Module;

    private static defaultOrThrow(defaultValue: any, error: Error): any {
        if (defaultValue === undefined) {
            throw error;
        } else {
            return defaultValue;
        }
    }

    private static chunkArray<T>(
        myArray: Array<T>,
        chunk_size
    ): Array<Array<T>> {
        const results = [];

        while (myArray.length) {
            results.push(myArray.splice(0, chunk_size));
        }

        return results;
    }

    public async execute(): Promise<Array<any>> {
        const batches = BatchManager.chunkArray(
            this.requests,
            BatchManager.BATCH_LIMIT
        );
        const results = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const rpcRequests = batch.map(value => value.request);
            const batchResponses = (await this.sendBatch(rpcRequests)) || [];

            const allResponses = batch.map((request, index) => {
                return batchResponses[index] || {};
            });

            const processedResults = [];
            for (let index = 0; index < allResponses.length; index++) {
                processedResults[index] = this.processResult(
                    allResponses[index],
                    batch[index]
                );
            }
            results.push(...processedResults);
        }
        this.requests = [];

        return results;
    }

    public add(request: BatchRequest): number {
        return this.requests.push(request);
    }

    // noinspection JSMethodCanBeStatic
    private processResult(
        responseItem: any,
        currentRequest: BatchRequest
    ): Object {
        let resultValue: Object;
        const defaultValue = currentRequest.defaultValue;
        const validationResult = Validator.validate(responseItem);

        if (validationResult) {
            try {
                const method = currentRequest.request;
                const mappedValue = method.afterExecution(responseItem.result);
                if (mappedValue) {
                    resultValue = mappedValue;
                } else {
                    resultValue = BatchManager.defaultOrThrow(
                        defaultValue,
                        new Error('missing value')
                    );
                }
            } catch (e) {
                resultValue = BatchManager.defaultOrThrow(defaultValue, e);
            }
        } else {
            resultValue = BatchManager.defaultOrThrow(
                defaultValue,
                new Error(`Validation failed`)
            );
        }

        return resultValue;
    }

    private sendBatch(rpcRequests: any): Promise<object[]> {
        return this.moduleInstance.currentProvider.sendBatch(
            rpcRequests,
            this.moduleInstance
        );
    }
}
