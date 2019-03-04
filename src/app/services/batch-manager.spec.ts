import { BatchManager, Validator } from './batch-manager';
import { HttpProvider } from 'web3-providers/types';
import { stub } from '../../testing/stub';
import { AbstractWeb3Module } from 'web3-core/types';
import { AbstractMethod } from 'web3-core-method/types';
import Spy = jasmine.Spy;

describe('BatchManager', () => {
    let batchManager: BatchManager;
    let provider: HttpProvider;
    let moduleInstanceMock: AbstractWeb3Module;
    let abstractMethod: AbstractMethod;
    let sendBatch: Spy;
    let afterExecution: Spy;
    let count: number;

    function getResponseStub(): Object {
        const countId = count++;
        return {
            jsonrpc: '2.0',
            id: countId,
            result: undefined
        };
    }

    beforeEach(() => {
        count = 0;
        provider = jasmine.createSpyObj('HttpProvider', ['send', 'sendBatch']);
        sendBatch = provider.sendBatch as Spy;

        abstractMethod = jasmine.createSpyObj('AbstractMethod', [
            'afterExecution',
            'callback'
        ]);

        abstractMethod.rpcMethod = 'rpc_method';
        abstractMethod.parameters = [true];
        afterExecution = abstractMethod.afterExecution as Spy;

        moduleInstanceMock = stub<AbstractWeb3Module>();
        // @ts-ignore
        moduleInstanceMock.currentProvider = provider;
        batchManager = new BatchManager(moduleInstanceMock);
    });

    it('should throw an exception if there is at least one error in the batch', async () => {
        sendBatch.and.returnValue(
            Promise.resolve([getResponseStub(), getResponseStub()])
        );
        afterExecution.and.returnValues('1').and.throwError('failed');

        batchManager.add({ request: abstractMethod });
        batchManager.add({ request: abstractMethod });

        try {
            await batchManager.execute();
            fail('There should be no result');
        } catch (e) {
            expect(e).toBeTruthy('There should be an error thrown');
        }
    });

    it('should process small batch and have the results', async () => {
        sendBatch.and.returnValue(
            Promise.resolve([getResponseStub(), getResponseStub()])
        );
        afterExecution.and.returnValues(1, 3);
        batchManager.add({ request: abstractMethod });
        batchManager.add({ request: abstractMethod });

        const result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(2, 'there should be two ');
    });

    it('should only call through the http provider for the batch', async () => {
        const responseItems = [];
        const batchSize = 800;

        for (let i = 0; i < batchSize; i++) {
            batchManager.add({ request: abstractMethod });
            responseItems.push(getResponseStub());
        }

        afterExecution.and.returnValue('test');
        sendBatch.and.returnValue(Promise.resolve(responseItems));

        const result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(
            batchSize,
            'there should be 800 results in the batch'
        );
        expect(provider.sendBatch).toHaveBeenCalledTimes(1);
        expect(provider.send).toHaveBeenCalledTimes(0);
    });

    it('should internally split the batch if more than 800 requests are batched', async () => {
        const responseItems = [];
        const batchSize = 1600;

        for (let i = 0; i < batchSize; i++) {
            batchManager.add({ request: abstractMethod });
            responseItems.push(getResponseStub());
        }

        sendBatch.and.returnValue(Promise.resolve(responseItems));

        afterExecution.and.returnValue('test');

        const result = await batchManager.execute();

        expect(result).toBeTruthy('there should be a result');
        expect(result.length).toBe(
            batchSize,
            'there should be 1600 results in response'
        );
        expect(provider.sendBatch).toHaveBeenCalledTimes(2);
        expect(provider.send).toHaveBeenCalledTimes(0);
    });

    it('should fail on Error', async () => {
        batchManager.add({ request: abstractMethod });

        afterExecution.and.throwError('failed');

        try {
            await batchManager.execute();
            fail('there should be no result');
        } catch (e) {
            expect(e).toBeTruthy();
        }
    });

    it('should fail on an invalid response', async () => {
        batchManager.add({ request: abstractMethod });
        const response = {
            jsonrpc: '2.0'
        };
        sendBatch.and.returnValue(Promise.resolve(response));
        afterExecution.and.callFake(() => {
            throw Validator.validate(response);
        });

        try {
            await batchManager.execute();
            fail('there should be no result');
        } catch (e) {
            expect(e).toMatch('Validation error: Undefined JSON-RPC result');
        }
    });

    it('should not fail the whole batch if there is an error response but the request has a default value', async function() {
        batchManager.add({
            request: abstractMethod,
            defaultValue: ''
        });

        batchManager.add({
            request: abstractMethod,
            defaultValue: ''
        });

        afterExecution.and.returnValues('test', '');
        const errorStub = getResponseStub();
        delete errorStub['result'];
        sendBatch.and.returnValues(getResponseStub(), errorStub);

        const result = await batchManager.execute();

        expect(result.length).toBe(2);
        expect(result[0]).toBe('test');
        expect(result[1]).toBe('');
    });

    it('should not fail the whole batch if there is an invalid response but the request has a default value', async function() {
        batchManager.add({
            request: abstractMethod,
            defaultValue: ''
        });

        batchManager.add({
            request: abstractMethod,
            defaultValue: ''
        });

        const stub1 = getResponseStub();
        const stub2 = { not_valid_response: true };

        sendBatch.and.returnValue(Promise.resolve([stub1, stub2]));

        let calls = 0;
        afterExecution.and.callFake(() => {
            if (calls === 0) {
                calls++;
                return 'test';
            }
            throw Validator.validate(stub2);
        });

        const result = await batchManager.execute();

        expect(result.length).toBe(2);
        expect(result[0]).toBe('test');
        expect(result[1]).toBe('');
    });
});
