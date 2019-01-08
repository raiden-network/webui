import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { MockConfig } from '../../testing/mock-config';
import { RaidenConfig } from './raiden.config';
import { SharedService } from './shared.service';

import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { BatchManager, BatchRequest } from './batch-manager';
import { UserToken } from '../models/usertoken';
import Spy = jasmine.Spy;

describe('TokenInfoRetriever', () => {
    let service: TokenInfoRetrieverService;
    let batchManager: BatchManager;
    let addSpy: Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                HttpClientTestingModule
            ],
            providers: [
                TokenInfoRetrieverService,
                SharedService,
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                }
            ]
        });

        const config = TestBed.get(RaidenConfig);

        function createMethod(name: string) {
            return function method() {
                return {
                    call: {
                        request: () => {
                            return name;
                        }
                    }
                };
            };
        }

        config.web3.eth.Contract = () => {
            return {
                options: {},
                methods: {
                    'name': createMethod('name'),
                    'decimals': createMethod('decimals'),
                    'symbol': createMethod('symbol'),
                    'balanceOf': createMethod('balanceOf')
                }
            };
        };

        let count = 1;


        batchManager = config.batchManager;
        addSpy = spyOn(batchManager, 'add').and.callFake(() => count++);
        service = TestBed.get(TokenInfoRetrieverService);
    });

    it('should be truthy', async(() => {
        expect(service).toBeTruthy();
    }));

    it('should propagate an error when the batch manager promise fails', async () => {

        spyOn(batchManager, 'execute').and.returnValue(new Promise((resolve, reject) => {
            reject(new Error('Invalid JSON RPC response'));
        }));

        const userTokens: { [address: string]: UserToken | null } = {};

        try {
            await service.createBatch([
                '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
            ], '0x82641569b2062B545431cF6D7F0A418582865ba7', userTokens);
            fail('There should be no result');
        } catch (e) {
            expect(e.message).toContain('Invalid JSON RPC response');
        }
    });

    it('should have add 4 requests the first time', async () => {
        spyOn(batchManager, 'execute').and.returnValue(new Promise((resolve) => {
            resolve(['TEST', 'TST', 18, 50]);
        }));

        const userTokens: { [address: string]: UserToken | null } = {};
        const tokens = await service.createBatch([
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        ], '0x82641569b2062B545431cF6D7F0A418582865ba7', userTokens);

        expect(addSpy).toHaveBeenCalledTimes(4);
        expect(tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED']).toBeTruthy();

        const calls = addSpy.calls;

        expect((calls.argsFor(0)[0] as BatchRequest).request).toBe('name');
        expect((calls.argsFor(1)[0] as BatchRequest).request).toBe('symbol');
        expect((calls.argsFor(2)[0] as BatchRequest).request).toBe('decimals');
        expect((calls.argsFor(3)[0] as BatchRequest).request).toBe('balanceOf');

        const userToken = tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED'];

        expect(userToken.name).toBe('TEST');
        expect(userToken.symbol).toBe('TST');
        expect(userToken.address).toBe('0x0f114A1E9Db192502E7856309cc899952b3db1ED');
        expect(userToken.decimals).toBe(18);
        expect(userToken.balance).toBe(50);
    });

    it('should have only on request if token is already cached', async () => {
        spyOn(batchManager, 'execute').and.returnValue(new Promise((resolve) => {
            resolve([150]);
        }));

        const userTokens: { [address: string]: UserToken | null } = {
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED': {
                name: 'TEST',
                symbol: 'TST',
                decimals: 18,
                address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
                balance: 10
            }
        };
        const tokens = await service.createBatch([
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        ], '0x82641569b2062B545431cF6D7F0A418582865ba7', userTokens);

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED']).toBeTruthy();

        const calls = addSpy.calls;

        expect((calls.argsFor(0)[0] as BatchRequest).request).toBe('balanceOf');

        const userToken = tokens['0x0f114A1E9Db192502E7856309cc899952b3db1ED'];

        expect(userToken.name).toBe('TEST');
        expect(userToken.symbol).toBe('TST');
        expect(userToken.address).toBe('0x0f114A1E9Db192502E7856309cc899952b3db1ED');
        expect(userToken.decimals).toBe(18);
        expect(userToken.balance).toBe(150);
        expect(typeof userToken.decimals).toBe('number');
        expect(typeof userToken.balance).toBe('number');
    });
});
