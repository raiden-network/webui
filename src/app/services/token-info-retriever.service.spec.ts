import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { RaidenConfig } from './raiden.config';
import {
    TokenInfoRetrieverService,
    BatchManagerFactory,
} from './token-info-retriever.service';
import { UserToken } from '../models/usertoken';
import { TestProviders } from '../../testing/test-providers';
import { AbiItem } from 'web3-utils/types';
import { ContractOptions } from 'web3-eth-contract/types';
import BigNumber from 'bignumber.js';

describe('TokenInfoRetriever', () => {
    let service: TokenInfoRetrieverService;
    let batchManagerFactory: BatchManagerFactory;
    let count: number;

    function createBatchManagerSpy(result) {
        const batchManager = jasmine.createSpyObj('BatchManager', [
            'add',
            'execute',
        ]);
        batchManager.execute.and.returnValue(result);
        batchManager.add.and.callFake(() => count++);
        return batchManager;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                TokenInfoRetrieverService,
                TestProviders.MockRaidenConfigProvider(),
                BatchManagerFactory,
            ],
        });

        const config = TestBed.inject(RaidenConfig);

        function createMethod(name: string) {
            // noinspection JSUnusedLocalSymbols
            return function method(any?: any) {
                return {
                    call: {
                        request: () => {
                            return name;
                        },
                    },
                };
            };
        }

        // @ts-ignore
        config.web3.eth.Contract = function (
            jsonInterface: AbiItem[] | AbiItem,
            address?: string,
            options?: ContractOptions
        ) {
            return {
                address: undefined,
                options: {},
                methods: {
                    name: createMethod('name'),
                    decimals: createMethod('decimals'),
                    symbol: createMethod('symbol'),
                    balanceOf: createMethod('balanceOf'),
                },
            };
        };

        count = 1;
        batchManagerFactory = TestBed.inject(BatchManagerFactory);

        service = TestBed.inject(TokenInfoRetrieverService);
    });

    it('should be truthy', async(() => {
        expect(service).toBeTruthy();
    }));

    it('should propagate an error when the batch manager promise fails', async () => {
        const batchManager = createBatchManagerSpy(
            new Promise((resolve, reject) => {
                reject(new Error('Invalid JSON RPC response'));
            })
        );
        spyOn(batchManagerFactory, 'create').and.returnValue(batchManager);

        const userTokens: { [address: string]: UserToken | null } = {};

        try {
            await service.createBatch(
                ['0x0f114A1E9Db192502E7856309cc899952b3db1ED'],
                '0x82641569b2062B545431cF6D7F0A418582865ba7',
                userTokens
            );
            fail('There should be no result');
        } catch (e) {
            expect(e.message).toContain('Invalid JSON RPC response');
        }
    });

    it('should have add 4 requests the first time', async () => {
        const batchManager = createBatchManagerSpy(
            new Promise((resolve) => {
                resolve(['TEST', 'TST', 18, 50]);
            })
        );
        spyOn(batchManagerFactory, 'create').and.returnValue(batchManager);

        const userTokens: { [address: string]: UserToken | null } = {};
        const tokens = await service.createBatch(
            ['0x0f114A1E9Db192502E7856309cc899952b3db1ED'],
            '0x82641569b2062B545431cF6D7F0A418582865ba7',
            userTokens
        );

        expect(batchManager.add).toHaveBeenCalledTimes(4);
        expect(
            tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED']
        ).toBeTruthy();

        const calls = batchManager.add.calls;

        expect(calls.argsFor(0)[0].request).toBe('name');
        expect(calls.argsFor(1)[0].request).toBe('symbol');
        expect(calls.argsFor(2)[0].request).toBe('decimals');
        expect(calls.argsFor(3)[0].request).toBe('balanceOf');

        const userToken = tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED'];

        expect(userToken.name).toBe('TEST');
        expect(userToken.symbol).toBe('TST');
        expect(userToken.address).toBe(
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        );
        expect(userToken.decimals).toBe(18);
        expect(userToken.balance).toEqual(new BigNumber(50));
    });

    it('should have only on request if token is already cached', async () => {
        const batchManager = createBatchManagerSpy(
            new Promise((resolve) => {
                resolve([150]);
            })
        );
        spyOn(batchManagerFactory, 'create').and.returnValue(batchManager);

        const userTokens: { [address: string]: UserToken | null } = {
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED': {
                name: 'TEST',
                symbol: 'TST',
                decimals: 18,
                address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
                balance: new BigNumber(10),
            },
        };
        const tokens = await service.createBatch(
            ['0x0f114A1E9Db192502E7856309cc899952b3db1ED'],
            '0x82641569b2062B545431cF6D7F0A418582865ba7',
            userTokens
        );

        expect(batchManager.add).toHaveBeenCalledTimes(1);
        expect(
            tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED']
        ).toBeTruthy();

        const calls = batchManager.add.calls;

        expect(calls.argsFor(0)[0].request).toBe('balanceOf');

        const userToken = tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED'];

        expect(userToken.name).toBe('TEST');
        expect(userToken.symbol).toBe('TST');
        expect(userToken.address).toBe(
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        );
        expect(userToken.decimals).toBe(18);
        expect(userToken.balance).toEqual(new BigNumber(150));
        expect(typeof userToken.decimals).toBe('number');
        expect(BigNumber.isBigNumber(userToken.balance)).toBe(true);
    });
});
