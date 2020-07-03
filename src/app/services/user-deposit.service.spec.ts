import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { UserDepositService } from './user-deposit.service';
import { TestProviders } from '../../testing/test-providers';
import { RaidenConfig } from './raiden.config';
import BigNumber from 'bignumber.js';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RaidenService } from './raiden.service';
import { stub } from '../../testing/stub';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
    createAddress,
    createContractsInfo,
    createToken,
} from '../../testing/test-data';
import { ContractOptions } from 'web3-eth-contract/types';
import { AbiItem } from 'web3-utils/types';
import Spy = jasmine.Spy;
import { TokenInfoRetrieverService } from './token-info-retriever.service';

describe('UserDepositService', () => {
    let service: UserDepositService;
    let reconnectedSubject: BehaviorSubject<void>;
    let rpcConnectedSubject: Subject<void>;
    let tokenResult: Promise<string>;
    let balanceResult: Promise<string>;
    let tokenRetrieverSpy: Spy;

    const balance = '40000000';
    const token = createToken();

    beforeEach(() => {
        const raidenServiceMock = stub<RaidenService>();
        // @ts-ignore
        raidenServiceMock.raidenAddress$ = of(createAddress());
        reconnectedSubject = new BehaviorSubject(null);
        // @ts-ignore
        raidenServiceMock.reconnected$ = reconnectedSubject.asObservable();
        rpcConnectedSubject = new BehaviorSubject(null);
        // @ts-ignore
        raidenServiceMock.rpcConnected$ = rpcConnectedSubject.asObservable();
        raidenServiceMock.getContractsInfo = () => of(createContractsInfo());

        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: RaidenService,
                    useValue: raidenServiceMock,
                },
                TokenInfoRetrieverService,
            ],
        });
        const raidenConfig = TestBed.inject(RaidenConfig);

        tokenResult = Promise.resolve(token.address);
        balanceResult = Promise.resolve(balance);

        // @ts-ignore
        raidenConfig.web3.eth.Contract = function (
            jsonInterface: AbiItem[] | AbiItem,
            address?: string,
            options?: ContractOptions
        ) {
            return {
                address: address,
                options: {},
                methods: {
                    token: () => {
                        return {
                            call: () => tokenResult,
                        };
                    },
                    balances: () => {
                        return {
                            call: () => balanceResult,
                        };
                    },
                },
            };
        };

        tokenRetrieverSpy = spyOn(
            TestBed.inject(TokenInfoRetrieverService),
            'createBatch'
        );

        service = TestBed.inject(UserDepositService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should periodically poll the UDC balance', fakeAsync(() => {
        const spy = jasmine.createSpy();
        const subscription = service.balance$.subscribe(spy);

        tick(15000);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(new BigNumber(balance));
        flush();
        subscription.unsubscribe();
    }));

    it('should retry polling the UDC balance after successful rpc connection attempt', fakeAsync(() => {
        const spy = jasmine.createSpy();
        balanceResult = Promise.reject();
        const subscription = service.balance$.subscribe(spy);

        balanceResult = Promise.resolve(balance);
        rpcConnectedSubject.next();

        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(new BigNumber(balance));
        flush();
        subscription.unsubscribe();
    }));

    it('should periodically poll the services token', fakeAsync(() => {
        tokenRetrieverSpy.and.returnValue(
            Promise.resolve({ [token.address]: token })
        );

        const spy = jasmine.createSpy();
        const subscription = service.servicesToken$.subscribe(spy);

        tick(15000);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(token);
        flush();
        subscription.unsubscribe();
    }));

    it('should retry getting the token address after successful rpc connection attempt', fakeAsync(() => {
        tokenRetrieverSpy.and.returnValue(
            Promise.resolve({ [token.address]: token })
        );

        const spy = jasmine.createSpy();
        tokenResult = Promise.reject();
        const subscription = service.servicesToken$.subscribe(spy);

        tokenResult = Promise.resolve(token.address);
        rpcConnectedSubject.next();

        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(token);
        flush();
        subscription.unsubscribe();
    }));

    it('should retry getting the token info after successful rpc connection attempt', fakeAsync(() => {
        tokenRetrieverSpy.and.returnValues(
            Promise.reject(),
            Promise.resolve({ [token.address]: token })
        );

        const spy = jasmine.createSpy();
        const subscription = service.servicesToken$.subscribe(spy);
        rpcConnectedSubject.next();

        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(token);
        flush();
        subscription.unsubscribe();
    }));
});
