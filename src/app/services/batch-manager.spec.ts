import { BatchManager } from "./batch-manager";
import { hexToString } from 'web3-utils'
import { formatters } from 'web3-core-helpers'
import Spy = jasmine.Spy;

interface JsonRPCRequest {
    format?: any;
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
}

interface JsonRPCResponse {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: RPRCResponseError;
}

interface RPRCResponseError {
    code: number;
    message: string;
}

interface Provider {
    send(
        payload: JsonRPCRequest,
        callback: (e: Error, val: JsonRPCResponse) => void
    ): any;
}

export class FakeHttpProvider implements Provider {
    private countId = 1;

    private response = [];
    private error = [];

    public send(payload: JsonRPCRequest, callback: (e: Error, val: JsonRPCResponse) => void) {

        if (payload.id) {
            this.countId = payload.id
        }

        if (!(payload instanceof Array) || !(payload instanceof Object)) {
            throw Error('payload should be either object or array')
        }

        const response = this.getResponseOrError('response', payload);
        const error = this.getResponseOrError('error', payload);

        // @ts-ignore
        setTimeout(() => callback(error, response), 1)
    }

    public getResponseOrError(type: any, payload: any | Array<any>): JsonRPCResponse | JsonRPCResponse[] {
        let response: JsonRPCResponse | JsonRPCResponse[];

        if (type === 'error') {
            response = this.error.shift();
        } else {
            response = this.response.shift() || this.getResponseStub();
        }

        if (response) {
            if (response instanceof Array) {

                let currentResponse: JsonRPCResponse[];

                if (response.length > payload.length) {
                    currentResponse = response.slice(0, payload.length);
                    this.response.push(response.slice(payload.length, response.length));
                } else {
                    currentResponse = response;
                }

                response = currentResponse.map((resp, index) => {
                    resp.id = payload[index] ? payload[index].id : this.countId++;
                    return resp;
                });

            } else {
                response.id = payload.id;
            }

        }

        return response;
    }

    public injectBatchResults(results: Array<any>, error: boolean = false) {
        this.response.push(results.map(value => {
            let response: JsonRPCResponse;

            if (error) {
                response = this.getErrorStub();
                response.error = value
            } else {
                response = this.getResponseStub();
                response.result = value;
            }

            return response
        }))
    }

    public injectResult(result: string) {
        const response = this.getResponseStub();
        response.result = result;
        this.response.push(response)
    }

    public injectInvalidResponse(response: object) {
        this.response.push(response);
    }

    public injectError(error: any) {
        const errorStub = this.getErrorStub();
        errorStub.error = error;
        this.error.push(errorStub)
    }

    private getResponseStub(): JsonRPCResponse {
        let countId = this.countId;
        return {
            jsonrpc: '2.0',
            id: countId,
            result: null
        }
    }

    private getErrorStub(): JsonRPCResponse {
        let countId = this.countId;
        return {
            jsonrpc: '2.0',
            id: countId,
            error: {
                code: 50010,
                message: 'Invalid Response?'
            }
        }
    }
}

function getEthCallStub(): JsonRPCRequest {
    return {
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_call',
        params: [
            {
                data: '0x06fdde03',
                to: '0xa72fe7fe1f1323586a80c6b631202bb15b0419ab'
            },
            'latest'
        ]
    }
}

function getRPCResult(): string {
    return "0x0"
}

describe('BatchManager', () => {
    let batchManager: BatchManager;
    let httpProvider: FakeHttpProvider;
    let providerSpy: Spy;

    beforeEach(() => {
        httpProvider = new FakeHttpProvider();
        // @ts-ignore
        batchManager = new BatchManager(httpProvider);
        providerSpy = spyOn(httpProvider, 'send');
        providerSpy.and.callThrough();
    });

    it('should throw an exception if there is at least one error in the batch', async () => {
        batchManager.add({request: getEthCallStub()});
        batchManager.add({request: getEthCallStub()});
        httpProvider.injectResult(getRPCResult());
        httpProvider.injectError('err');

        try {
            await batchManager.execute();
            fail('There should be no result')
        } catch (e) {
            expect(e).toBeTruthy("There should be an error thrown")
        }
    });


    it('should process small batch and have the results', async () => {
        httpProvider.injectBatchResults([
            getRPCResult(),
            getRPCResult()
        ]);

        batchManager.add({request: getEthCallStub()});
        batchManager.add({request: getEthCallStub()});

        let result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(2, 'there should be two ')
    });

    it('should only call through the http provider for the batch', async () => {

        const results = [];

        let batchSize = 800;

        for (let i = 0; i < batchSize; i++) {
            let ethCallStub = getEthCallStub();
            ethCallStub.id = i + 1;
            batchManager.add({request: ethCallStub});

            results.push(getRPCResult())
        }

        httpProvider.injectBatchResults(results);

        let result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(batchSize, 'there should be 800 results in the batch');
        expect(httpProvider.send).toHaveBeenCalledTimes(1);
    });

    it('should internally split the batch if more than 800 requests are batched', async () => {
        const results = [];

        let batchSize = 1600;

        for (let i = 0; i < batchSize; i++) {
            let ethCallStub = getEthCallStub();
            ethCallStub.id = i + 1;
            batchManager.add({request: ethCallStub});

            results.push(getRPCResult())
        }

        httpProvider.injectBatchResults(results);

        let result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(batchSize, 'there should be 1600 results in response');
        expect(httpProvider.send).toHaveBeenCalledTimes(2);
    });


    it('should fail on Error', async () => {
        let ethCallStub = getEthCallStub();
        batchManager.add({request: ethCallStub});
        httpProvider.injectBatchResults([getRPCResult()], true);

        try {
            await batchManager.execute();
            fail('there should be no result')
        } catch (e) {
            expect(e).toBeTruthy();
        }
    });

    it('should fail on an invalid response', async () => {
        let ethCallStub = getEthCallStub();
        batchManager.add({request: ethCallStub});
        httpProvider.injectInvalidResponse({
            jsonrpc: '2.0',
            id: 2
        });

        try {
            await batchManager.execute();
            fail('there should be no result')
        } catch (e) {
            expect(e).toMatch('Invalid JSON RPC response')
        }
    });

    it('should ignore failure if there is a default value and the formatter throws', async () => {
        let ethCallStub = getEthCallStub();
        ethCallStub.format = function () {
            throw Error('format failed')
        };
        batchManager.add({
            request: ethCallStub,
            defaultValue: ''
        });

        httpProvider.injectBatchResults(['0x4d4b520000000000000000000000000000000000000000000000000000000000']);

        let result = await batchManager.execute();

        expect(result.length).toBe(1);
        expect(result[0]).toBe('');
    });

    it('should fail if there is no default value and the formatter throws', async () => {
        let ethCallStub = getEthCallStub();
        ethCallStub.format = function () {
            throw Error('format failed')
        };
        batchManager.add({
            request: ethCallStub
        });

        httpProvider.injectBatchResults(['0x4d4b520000000000000000000000000000000000000000000000000000000000']);

        try {
            await batchManager.execute();
            fail('there should be no result')
        } catch (e) {
            expect(e).toBeTruthy();
            expect(e.message).toMatch('format failed');
        }
    });
});