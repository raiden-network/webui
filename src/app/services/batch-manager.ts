import { Manager } from 'web3-core-requestmanager';
import { provider } from 'web3-core';
import { errors } from 'web3-core-helpers';
import { Method } from 'web3-core-method';

export interface BatchRequest {
    readonly request: Method | any;
    readonly defaultValue?: any;
}

export class BatchManager {
    private static BATCH_LIMIT = 800;
    private requests: Array<BatchRequest> = [];
    private requestManager: Manager;

    constructor(web3Provider: provider) {
        this.requestManager = new Manager(web3Provider);
    }

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

        for (const batch of batches) {
            const rpcRequests = batch.map((value) => value.request);
            const batchResponses = (await this.sendBatch(rpcRequests)) || [];

            const allResponses = batch.map(
                (request, index) => batchResponses[index] || {}
            );

            const processedResponses = [];
            for (let index = 0; index < allResponses.length; index++) {
                processedResponses[index] = this.processResponse(
                    allResponses[index],
                    batch[index]
                );
            }
            results.push(...processedResponses);
        }
        this.requests = [];

        return results;
    }

    public add(request: BatchRequest): number {
        return this.requests.push(request);
    }

    private processResponse(
        responseItem: any,
        currentRequest: BatchRequest
    ): any {
        let resultValue: any;
        const defaultValue = currentRequest.defaultValue;

        if (responseItem && responseItem.error) {
            resultValue = BatchManager.defaultOrThrow(
                defaultValue,
                errors.ErrorResponse(responseItem)
            );
        } else if (!this.isValidResponse(responseItem)) {
            resultValue = BatchManager.defaultOrThrow(
                defaultValue,
                errors.ErrorResponse(responseItem)
            );
        } else {
            try {
                // @ts-ignore
                const format = currentRequest.request.format;
                resultValue = format
                    ? format(responseItem.result)
                    : responseItem.result;
            } catch (e) {
                resultValue = BatchManager.defaultOrThrow(defaultValue, e);
            }
        }

        return resultValue;
    }

    private sendBatch(rpcRequests: any): Promise<Array<any>> {
        return new Promise<Array<any>>((resolve, reject) => {
            this.requestManager.sendBatch(
                rpcRequests,
                (err: any, results: Array<any>) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }

    private isValidResponse(response: any) {
        return (
            !!response &&
            !Array.isArray(response) &&
            !response.error &&
            response.jsonrpc === '2.0' &&
            (typeof response.id === 'number' ||
                typeof response.id === 'string') &&
            response.result !== undefined
        );
    }
}
