import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { UserDepositService } from './user-deposit.service';
import { TestProviders } from '../../testing/test-providers';
import { RaidenConfig } from './raiden.config';
import BigNumber from 'bignumber.js';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RaidenService } from './raiden.service';
import { stub } from '../../testing/stub';
import { BehaviorSubject, Subject, of, throwError, NEVER } from 'rxjs';
import {
    createAddress,
    createContractsInfo,
    createToken,
} from '../../testing/test-data';
import { ContractOptions } from 'web3-eth-contract/types';
import { AbiItem } from 'web3-utils/types';
import Spy = jasmine.Spy;
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { UserToken } from '../models/usertoken';
import { NotificationService } from './notification.service';
import { MockConfig } from 'testing/mock-config';

describe('UserDepositService', () => {
    let service: UserDepositService;
    let reconnectedSubject: BehaviorSubject<void>;
    let rpcConnectedSubject: Subject<void>;
    let tokenAddressResult: Promise<string>;
    let balanceResult: Promise<string>;
    let tokenBalanceResult: Promise<string>;
    let withdrawPlanResult: Promise<{ amount: string; withdraw_block: string }>;
    let tokenRetrieverSpy: Spy;

    const balance = '40000000';
    const totalDeposit = '333';
    let token: UserToken;

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
        raidenServiceMock.depositToUdc = () => of(null);
        raidenServiceMock.planUdcWithdraw = () => of(null);
        raidenServiceMock.withdrawFromUdc = () => of(null);

        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: RaidenService,
                    useValue: raidenServiceMock,
                },
                TokenInfoRetrieverService,
                TestProviders.SpyNotificationServiceProvider(),
            ],
        });
        const raidenConfig = TestBed.inject(RaidenConfig);

        token = createToken();
        tokenAddressResult = Promise.resolve(token.address);
        balanceResult = Promise.resolve(balance);
        tokenBalanceResult = Promise.resolve(token.balance.toString());
        withdrawPlanResult = Promise.resolve({
            amount: '0',
            withdraw_block: '0',
        });
        const totalDepsositResult = Promise.resolve(totalDeposit);

        // @ts-ignore
        raidenConfig.web3.eth.Contract = function (
            jsonInterface: AbiItem[],
            address?: string,
            options?: ContractOptions
        ) {
            const contractMock = {
                address,
                options: {},
                methods: {},
            };
            if (
                jsonInterface.find((item: AbiItem) => item.name === 'balanceOf')
            ) {
                contractMock.methods = {
                    balanceOf: () => ({
                        call: () => tokenBalanceResult,
                    }),
                };
            } else {
                contractMock.methods = {
                    token: () => ({
                        call: () => tokenAddressResult,
                    }),
                    balances: () => ({
                        call: () => balanceResult,
                    }),
                    total_deposit: () => ({
                        call: () => totalDepsositResult,
                    }),
                    withdraw_plans: () => ({
                        call: () => withdrawPlanResult,
                    }),
                };
            }
            return contractMock;
        };

        tokenRetrieverSpy = spyOn(
            TestBed.inject(TokenInfoRetrieverService),
            'createBatch'
        ).and.returnValue(Promise.resolve({ [token.address]: token }));

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
        tokenBalanceResult = Promise.resolve('999999');
        const tokenWithFetchedBalance = Object.assign({}, token, {
            balance: new BigNumber('999999'),
        });

        const spy = jasmine.createSpy();
        const subscription = service.servicesToken$.subscribe(spy);

        tick(15000);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(tokenWithFetchedBalance);
        flush();
        subscription.unsubscribe();
    }));

    it('should retry getting the token address after successful rpc connection attempt', fakeAsync(() => {
        const spy = jasmine.createSpy();
        tokenAddressResult = Promise.reject();
        const subscription = service.servicesToken$.subscribe(spy);

        tokenAddressResult = Promise.resolve(token.address);
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

    it('should show notifications when depositing', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'depositToUdc').and.callThrough();

        const deposit = new BigNumber('666');
        service
            .deposit(deposit)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(raidenService.depositToUdc).toHaveBeenCalledTimes(1);
        expect(raidenService.depositToUdc).toHaveBeenCalledWith(
            deposit.plus(totalDeposit)
        );
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should show notifications when planning a withdraw', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'planUdcWithdraw').and.callThrough();

        const withdrawAmount = new BigNumber('21');
        service
            .planWithdraw(withdrawAmount)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(raidenService.planUdcWithdraw).toHaveBeenCalledTimes(1);
        expect(raidenService.planUdcWithdraw).toHaveBeenCalledWith(
            withdrawAmount
        );
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should show notifications when withdrawing', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'withdrawFromUdc').and.callThrough();

        const withdrawAmount = new BigNumber('123456');
        service
            .withdraw(withdrawAmount)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(raidenService.withdrawFromUdc).toHaveBeenCalledTimes(1);
        expect(raidenService.withdrawFromUdc).toHaveBeenCalledWith(
            withdrawAmount
        );
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should show error notifications when deposit fails', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'depositToUdc').and.returnValue(
            throwError('Deposit failed')
        );

        const errorSpy = jasmine.createSpy();
        const deposit = new BigNumber('666');
        service
            .deposit(deposit)
            .subscribe(() => {
                fail('On next should not be called');
            }, errorSpy)
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should show error notifications when plan withdraw fails', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'planUdcWithdraw').and.returnValue(
            throwError('Plan withdraw failed')
        );

        const errorSpy = jasmine.createSpy();
        const withdrawAmount = new BigNumber('21');
        service
            .planWithdraw(withdrawAmount)
            .subscribe(() => {
                fail('On next should not be called');
            }, errorSpy)
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should show error notifications when withdraw fails', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'withdrawFromUdc').and.returnValue(
            throwError('Withdraw failed')
        );

        const errorSpy = jasmine.createSpy();
        const withdrawAmount = new BigNumber('123456');
        service
            .withdraw(withdrawAmount)
            .subscribe(() => {
                fail('On next should not be called');
            }, errorSpy)
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        tick();
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should throw an error if there is a pending deposit', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'depositToUdc').and.returnValue(NEVER);

        const deposit = new BigNumber('100');
        service.deposit(deposit).subscribe();
        tick();
        expect(service.depositPending).toBe(true);

        const errorSpy = jasmine.createSpy();
        service.deposit(deposit).subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should throw an error if there is a pending withdraw plan', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'planUdcWithdraw').and.returnValue(NEVER);

        const amount = new BigNumber('100');
        service.planWithdraw(amount).subscribe();
        tick();
        expect(service.planWithdrawPending).toBe(true);

        const errorSpy = jasmine.createSpy();
        service.planWithdraw(amount).subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should throw an error if there is a pending withdraw', fakeAsync(() => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'withdrawFromUdc').and.returnValue(NEVER);

        const amount = new BigNumber('100');
        service.withdraw(amount).subscribe();
        tick();
        expect(service.withdrawPending).toBe(true);

        const errorSpy = jasmine.createSpy();
        service.withdraw(amount).subscribe(() => {
            fail('On next should not be called');
        }, errorSpy);
        tick();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        flush();
    }));

    it('should refresh the withdraw plan', fakeAsync(() => {
        const spy = jasmine.createSpy();
        const subscription = service.withdrawPlan$.subscribe(spy);
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({
            amount: new BigNumber(0),
            withdrawBlock: 0,
        });

        withdrawPlanResult = Promise.resolve({
            amount: '500',
            withdraw_block: '9000',
        });
        service.refreshWithdrawPlan();
        tick();
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith({
            amount: new BigNumber(500),
            withdrawBlock: 9000,
        });
        flush();
        subscription.unsubscribe();
    }));

    it('should retry polling the withdraw plan after successful rpc connection attempt', fakeAsync(() => {
        const spy = jasmine.createSpy();
        withdrawPlanResult = Promise.reject();
        const subscription = service.withdrawPlan$.subscribe(spy);

        withdrawPlanResult = Promise.resolve({
            amount: '50',
            withdraw_block: '3',
        });
        rpcConnectedSubject.next();

        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({
            amount: new BigNumber(50),
            withdrawBlock: 3,
        });
        flush();
        subscription.unsubscribe();
    }));

    it('should periodically poll the blocks until withdrawal is ready', fakeAsync(() => {
        const notificationService = TestBed.inject(NotificationService);
        const raidenConfig = TestBed.inject(RaidenConfig) as MockConfig;
        raidenConfig.web3.eth.getBlockNumber = () => Promise.resolve(1100);

        const spy = jasmine.createSpy();
        const subscription = service.blocksUntilWithdraw$.subscribe(spy);
        tick();
        expect(spy).toHaveBeenCalledTimes(0);

        withdrawPlanResult = Promise.resolve({
            amount: '500',
            withdraw_block: '1200',
        });
        service.refreshWithdrawPlan();
        tick();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(100);

        raidenConfig.web3.eth.getBlockNumber = () => Promise.resolve(1200);
        tick(15000);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(0);
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );

        raidenConfig.web3.eth.getBlockNumber = () => Promise.resolve(1201);
        tick(15000);
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenCalledWith(0);
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );

        flush();
        subscription.unsubscribe();
    }));
});
