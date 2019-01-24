import { Manager } from 'web3-core-requestmanager';
import { JsonRPCRequest, Provider } from 'web3/providers';
import { errors } from 'web3-core-helpers';

export interface BatchRequest {
    readonly request: JsonRPCRequest | any;
    readonly defaultValue?: any;
}

export class BatchManager {
    private static BATCH_LIMIT = 800;

    private requests: Array<BatchRequest> = [];
    private requestManager: Manager;

    constructor(provider: Provider) {
        this.requestManager = new Manager(provider);
    }

    private static defaultOrThrow(defaultValue: any, error: Error): any {
        if (defaultValue === undefined) {
            throw error;
        } else {
            return defaultValue;
        }
    }

    private static chunkArray<T>(myArray: Array<T>, chunk_size): Array<Array<T>> {
        const results = [];

        while (myArray.length) {
            results.push(myArray.splice(0, chunk_size));
        }

        return results;
    }

    public async execute(): Promise<Array<any>> {
        const batches = BatchManager.chunkArray(this.requests, BatchManager.BATCH_LIMIT);
        const results = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const rpcRequests = batch.map(value => value.request);
            const batchResults = await this.sendBatch(rpcRequests) || [];

            const allResults = batch.map((request, index) => {
                return batchResults[index] || {};
            });

            const processedResults = [];
            for (let index = 0; index < allResults.length; index++) {
                processedResults[index] = this.processResult(allResults[index], batch[index]);
            }
            results.push(...processedResults);
        }
        this.requests = [];

        return results;
    }

    public add(request: BatchRequest): number {
        return this.requests.push(request);
    }

    private processResult(result: any, currentRequest: BatchRequest): Object {
        let resultValue: Object;
        const defaultValue = currentRequest.defaultValue;

        if (result && result.error) {
            resultValue = BatchManager.defaultOrThrow(defaultValue, errors.ErrorResponse(result));
        } else if (!this.isValidResponse(result)) {
            resultValue = BatchManager.defaultOrThrow(defaultValue, errors.ErrorResponse(result));
        } else {
            try { // @ts-ignore
                const format = currentRequest.request.format;
                resultValue = format ? format(result.result) : result.result;
            } catch (e) {
                resultValue = BatchManager.defaultOrThrow(defaultValue, e);
            }
        }

        return resultValue;
    }

    private sendBatch(rpcRequests: any): Promise<Array<any>> {
        return new Promise<Array<any>>((resolve, reject) => {
            this.requestManager.sendBatch(rpcRequests, (err: any, results: Array<any>) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }

            });
        });
    }

    private isValidResponse(response: any) {

        return Array.isArray(response) ? response.every(validateSingleMessage) : validateSingleMessage(response);

        function validateSingleMessage(message) {
            return !!message &&
                !message.error &&
                message.jsonrpc === '2.0' &&
                (typeof message.id === 'number' || typeof message.id === 'string') &&
                message.result !== undefined; // only undefined is not valid json object
        }
    }
}
