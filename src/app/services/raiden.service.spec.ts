import {
    HttpClientModule,
    HTTP_INTERCEPTORS,
    HttpErrorResponse,
} from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Channel } from '../models/channel';
import { RaidenConfig, Web3Factory } from './raiden.config';
import { RaidenService } from './raiden.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { TestProviders } from '../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { DepositMode } from '../models/deposit-mode.enum';
import {
    createChannel,
    createPaymentEvent,
    createToken,
    createNetworkMock,
    createAddress,
    createContractsInfo,
} from '../../testing/test-data';
import Spy = jasmine.Spy;
import { Connection } from '../models/connection';
import { LosslessJsonInterceptor } from '../interceptors/lossless-json.interceptor';
import {
    losslessParse,
    losslessStringify,
} from '../utils/lossless-json.converter';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import { ErrorHandlingInterceptor } from '../interceptors/error-handling.interceptor';
import { PaymentEvent } from '../models/payment-event';
import { MockConfig } from '../../testing/mock-config';
import { TokenInfo } from '../models/usertoken';

describe('RaidenService', () => {
    const token = createToken();
    const raidenAddress = '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C';

    let mockHttp: HttpTestingController;
    let notificationService: NotificationService;
    let endpoint: String;

    let service: RaidenService;

    let retrieverSpy: Spy;

    const channel1: Channel = createChannel({
        channel_identifier: new BigNumber(1),
        balance: new BigNumber(0),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        token_address: token.address,
    });

    const channel2: Channel = createChannel({
        channel_identifier: new BigNumber(2),
        balance: new BigNumber(0),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        token_address: token.address,
    });

    const paymentEvent = createPaymentEvent('EventPaymentReceivedSuccess');

    beforeEach(() => {
        notificationService = jasmine.createSpyObj('NotificationService', [
            'addPendingAction',
            'removePendingAction',
            'addSuccessNotification',
            'addInfoNotification',
            'addErrorNotification',
        ]);
        notificationService.apiError = null;

        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
                {
                    provide: NotificationService,
                    useValue: notificationService,
                },
                TokenInfoRetrieverService,
                Web3Factory,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: ErrorHandlingInterceptor,
                    deps: [NotificationService, RaidenService],
                    multi: true,
                },
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: LosslessJsonInterceptor,
                    multi: true,
                },
                TestProviders.AddressBookStubProvider(),
            ],
        });

        mockHttp = TestBed.inject(HttpTestingController);

        endpoint = TestBed.inject(RaidenConfig).api;
        service = TestBed.inject(RaidenService);
        notificationService = TestBed.inject(NotificationService);

        retrieverSpy = spyOn(
            TestBed.inject(TokenInfoRetrieverService),
            'createBatch'
        );
        // @ts-ignore
        service.userTokens[token.address] = token;
    });

    afterEach(inject(
        [HttpTestingController],
        (backend: HttpTestingController) => {
            backend.verify();
        }
    ));

    it('should return the raiden version', () => {
        const version = '0.100.5a1.dev157+geb2af878d';
        service.getVersion().subscribe((value) => expect(value).toBe(version));

        const request = mockHttp.expectOne({
            url: `${endpoint}/version`,
            method: 'GET',
        });

        request.flush(
            {
                version: version,
            },
            {
                status: 200,
                statusText: '',
            }
        );
    });

    it('should inform the user when token network creation was completed successfully', () => {
        service
            .registerToken(token.address)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/tokens/${token.address}`,
            method: 'PUT',
        });
        expect(losslessParse(request.request.body)).toEqual({});
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(
            {
                token_network_address:
                    '0xc52952ebad56f2c5e5b42bb881481ae27d036475',
            },
            {
                status: 201,
                statusText: '',
            }
        );

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    });

    it('When token network creation fails there should be a nice message', () => {
        service
            .registerToken(token.address)
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error is expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const registerRequest = mockHttp.expectOne({
            url: `${endpoint}/tokens/${token.address}`,
            method: 'PUT',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        const errorMessage = 'Token already registered';
        const errorBody = {
            errors: errorMessage,
        };

        registerRequest.flush(errorBody, {
            status: 409,
            statusText: '',
        });

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should request the api to open a channel', () => {
        const partnerAddress = '0xc52952ebad56f2c5e5b42bb881481ae27d036475';

        service
            .openChannel(token.address, partnerAddress, 500, new BigNumber(10))
            .subscribe((channel: Channel) => expect(channel).toEqual(channel1))
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const openChannelRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'PUT',
        });

        expect(losslessParse(openChannelRequest.request.body)).toEqual({
            token_address: token.address,
            partner_address: partnerAddress,
            settle_timeout: new BigNumber(500),
            total_deposit: new BigNumber(10),
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        openChannelRequest.flush(losslessStringify(channel1), {
            status: 200,
            statusText: '',
        });
    });

    it('Show a proper response when non-EIP addresses are passed in channel creation', () => {
        const partnerAddress = '0xc52952ebad56f2c5e5b42bb881481ae27d036475';

        service
            .openChannel(token.address, partnerAddress, 500, new BigNumber(10))
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const openChannelRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'PUT',
        });

        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        const errorBody = {
            errors: { partner_address: ['Not a valid EIP55 encoded address'] },
        };

        openChannelRequest.flush(errorBody, {
            status: 409,
            statusText: '',
        });

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should have user token included in the channels', fakeAsync(() => {
        spyOn(service, 'getTokens').and.returnValue(of([token]));

        service.getChannels().subscribe(
            (channels: Array<Channel>) => {
                channels.forEach((value) => {
                    expect(value.userToken).toBeTruthy(
                        'UserToken should not be null'
                    );
                    expect(value.userToken.address).toBe(token.address);
                });
            },
            (error) => {
                fail(error);
            }
        );

        const getChannelsRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'GET',
        });

        getChannelsRequest.flush(losslessStringify([channel1, channel2]), {
            status: 200,
            statusText: 'All good',
        });

        tick();
        flush();
    }));

    it('should show an info message if attempted connection is successful', fakeAsync(function () {
        const config: RaidenConfig = TestBed.inject(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(true));

        service.attemptRpcConnection();
        tick();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should show an error message if attempted connection is unsuccessful', fakeAsync(function () {
        const config = TestBed.inject(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(false));

        service.attemptRpcConnection();
        tick();
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should show an error message if attempted connection is load fails', fakeAsync(function () {
        const config = TestBed.inject(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.callFake(() => Promise.reject(new Error('failed')));

        service.attemptRpcConnection();
        tick();
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should not show a notification for successful rpc connection when flag set to false', fakeAsync(function () {
        const config: RaidenConfig = TestBed.inject(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(true));

        service.attemptRpcConnection(false);
        tick();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
    }));

    it('should not show a notification for unsuccessful rpc connection when flag set to false', fakeAsync(function () {
        const config = TestBed.inject(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(false));

        service.attemptRpcConnection(false);
        tick();
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            0
        );
    }));

    it('should periodically poll the balance', fakeAsync(function () {
        let count = 0;
        const config = TestBed.inject(RaidenConfig);

        const eth = config.web3.eth;

        // @ts-ignore
        config.web3.eth = {
            getBalance(address: string): Promise<string> {
                return Promise.resolve(
                    new BigNumber('2000000000000000000').toString()
                );
            },
        };

        tick(15000);

        const subscription = service.balance$.subscribe((value) => {
            expect(value).toEqual('2');
            count++;
        });

        const addressRequest = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET',
        });

        const body = {
            our_address: raidenAddress,
        };

        addressRequest.flush(body, {
            status: 200,
            statusText: '',
        });

        flush();
        expect(count).toEqual(1);
        subscription.unsubscribe();
        config.web3.eth = eth;
    }));

    it('should retry polling the balance when rpc connection attempt was successful', fakeAsync(() => {
        let count = 0;
        const raidenConfig = TestBed.inject(RaidenConfig);

        const eth = raidenConfig.web3.eth;

        // @ts-ignore
        raidenConfig.web3.eth = {
            getBalance(address: string): Promise<string> {
                return Promise.reject();
            },
        };

        tick(15000);

        const subscription = service.balance$.subscribe((value) => {
            expect(value).toEqual('2');
            count++;
        });

        mockHttp
            .expectOne({
                url: `${endpoint}/address`,
                method: 'GET',
            })
            .flush(
                {
                    our_address: raidenAddress,
                },
                {
                    status: 200,
                    statusText: '',
                }
            );

        // @ts-ignore
        raidenConfig.web3.eth = {
            getBalance(address: string): Promise<string> {
                return Promise.resolve(
                    new BigNumber('2000000000000000000').toString()
                );
            },
        };

        const loadSpy = spyOn(raidenConfig, 'load');
        loadSpy.and.returnValue(Promise.resolve(true));
        service.attemptRpcConnection();

        flush();
        expect(count).toEqual(1);
        subscription.unsubscribe();
        raidenConfig.web3.eth = eth;
    }));

    it('should notify the user when a deposit was complete successfully', fakeAsync(() => {
        const channel = createChannel({
            channel_identifier: new BigNumber(1),
            total_deposit: new BigNumber(1000000),
            balance: new BigNumber(10),
            total_withdraw: new BigNumber(0),
            token_address: token.address,
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                token.address,
                '0xpartn',
                new BigNumber(100000000000),
                DepositMode.DEPOSIT
            )
            .subscribe((value) => {
                expect(value).toEqual(
                    createChannel({
                        channel_identifier: new BigNumber(1),
                        total_withdraw: new BigNumber(0),
                        total_deposit: new BigNumber(100001000000),
                        balance: new BigNumber(100000000010),
                        partner_address: channel.partner_address,
                        token_address: token.address,
                    })
                );
            })
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/0xpartn`,
            method: 'PATCH',
        });

        const body = Object.assign({}, channel, {
            total_deposit: 100001000000,
            balance: 100000000010,
        });

        expect(losslessParse(request.request.body)).toEqual({
            total_deposit: new BigNumber(100001000000),
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(losslessStringify(body), {
            status: 200,
            statusText: '',
        });

        flush();

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    }));

    it('should inform the user when a withdraw was completed successfully', fakeAsync(() => {
        const channel = createChannel({
            channel_identifier: new BigNumber(1),
            total_deposit: new BigNumber(10),
            balance: new BigNumber(1000000000000),
            total_withdraw: new BigNumber(1000000),
            token_address: token.address,
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                token.address,
                '0xpartn',
                new BigNumber(1000000000000),
                DepositMode.WITHDRAW
            )
            .subscribe((value) => {
                expect(value).toEqual(
                    createChannel({
                        channel_identifier: new BigNumber(1),
                        total_withdraw: new BigNumber(1000001000000),
                        total_deposit: new BigNumber(10),
                        balance: new BigNumber(0),
                        partner_address: channel.partner_address,
                        token_address: token.address,
                    })
                );
            })
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/0xpartn`,
            method: 'PATCH',
        });

        const body = Object.assign({}, channel, {
            total_withdraw: 1000001000000,
            balance: 0,
        });

        expect(losslessParse(request.request.body)).toEqual({
            total_withdraw: new BigNumber(1000001000000),
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(losslessStringify(body), {
            status: 200,
            statusText: '',
        });

        flush();

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    }));

    it('should inform the user when a deposit was not successful', () => {
        const channel = createChannel({
            channel_identifier: new BigNumber(1),
            total_deposit: new BigNumber(1000000),
            balance: new BigNumber(10),
            total_withdraw: new BigNumber(0),
            token_address: token.address,
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                token.address,
                '0xpartn',
                new BigNumber(100000000000),
                DepositMode.DEPOSIT
            )
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/0xpartn`,
            method: 'PATCH',
        });

        const errorMessage = 'Not enough funds';
        const errorBody = {
            errors: errorMessage,
        };
        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should inform the user when a withdraw was not successful', () => {
        const channel = createChannel({
            channel_identifier: new BigNumber(1),
            total_deposit: new BigNumber(10),
            balance: new BigNumber(1000000000000),
            total_withdraw: new BigNumber(1000000),
            userToken: token,
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                token.address,
                '0xpartn',
                new BigNumber(1000000000000),
                DepositMode.WITHDRAW
            )
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/0xpartn`,
            method: 'PATCH',
        });

        const errorMessage = 'Withdraw failed';
        const errorBody = {
            errors: errorMessage,
        };
        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should inform the user when minting was completed successfully', () => {
        service
            .mintToken(token, '0xto', new BigNumber(1000))
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        const request = mockHttp.expectOne({
            url: `${endpoint}/_testing/tokens/${token.address}/mint`,
            method: 'POST',
        });
        expect(losslessParse(request.request.body)).toEqual({
            to: '0xto',
            value: new BigNumber(1000),
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(
            { transaction_hash: '0xabc' },
            {
                status: 200,
                statusText: '',
            }
        );

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    });

    it('should inform the user when minting was not successful', () => {
        service
            .mintToken(token, '0xto', new BigNumber(1000))
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/_testing/tokens/${token.address}/mint`,
            method: 'POST',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        const errorMessage = 'Token does not have a mint method';
        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should inform the user when quick connect was successful', fakeAsync(() => {
        service
            .connectTokenNetwork(new BigNumber(1000), token.address)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'PUT',
        });
        expect(losslessParse(request.request.body)).toEqual({
            funds: new BigNumber(1000),
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(
            {},
            {
                status: 204,
                statusText: '',
            }
        );
        flush();

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    }));

    it('should inform the user when quick connect was not successful', fakeAsync(() => {
        service
            .connectTokenNetwork(new BigNumber(1000), token.address)
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'PUT',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        const errorMessage = 'Insufficient balance';
        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        flush();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should inform the user when leaving a token network was successful', fakeAsync(() => {
        service
            .leaveTokenNetwork(token)
            .subscribe((value) => expect(value).toBeFalsy())
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'DELETE',
        });
        expect(losslessParse(request.request.body)).toBe(null);
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(
            {},
            {
                status: 200,
                statusText: '',
            }
        );
        flush();

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    }));

    it('should inform the user when leaving a token network was not successful', fakeAsync(() => {
        service
            .leaveTokenNetwork(token)
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'DELETE',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        const errorMessage = 'Not a valid token network address';
        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        flush();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should inform the user when a payment was successful', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        const paymentIdentifier = new BigNumber(3);
        service
            .initiatePayment(
                token.address,
                targetAddress,
                amount,
                paymentIdentifier
            )
            .subscribe((value) => expect(value).toBeFalsy());
        tick(500);

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${token.address}/${targetAddress}`,
            method: 'POST',
        });
        expect(losslessParse(request.request.body)).toEqual({
            amount,
            identifier: paymentIdentifier,
        });

        const body = {
            target_address: targetAddress,
            identifier: paymentIdentifier,
        };

        request.flush(body, {
            status: 200,
            statusText: '',
        });
        flush();

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    }));

    it('should set a payment identifier for a payment when none is passed', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        spyOnProperty(service, 'identifier', 'get').and.returnValue(50);
        service
            .initiatePayment(token.address, targetAddress, amount)
            .subscribe();
        tick(500);

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${token.address}/${targetAddress}`,
            method: 'POST',
        });
        expect(losslessParse(request.request.body)).toEqual({
            amount,
            identifier: new BigNumber(50),
        });
        flush();
    }));

    it('should inform the user when a payment was not successful', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        const paymentIdentifier = new BigNumber(3);
        service
            .initiatePayment(
                token.address,
                targetAddress,
                amount,
                paymentIdentifier
            )
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            );
        tick(500);

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${token.address}/${targetAddress}`,
            method: 'POST',
        });

        const errorMessage = 'Payment was not successful';
        const errorBody = {
            errors: errorMessage,
        };

        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        flush();

        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    }));

    it('should trigger the payment initiated observable when payment sent', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        const paymentIdentifier = new BigNumber(3);
        let emitted = false;
        service.paymentInitiated$.subscribe(() => {
            emitted = true;
        });
        service
            .initiatePayment(
                token.address,
                targetAddress,
                amount,
                paymentIdentifier
            )
            .subscribe((value) => expect(value).toBeFalsy());

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${token.address}/${targetAddress}`,
            method: 'POST',
        });
        expect(losslessParse(request.request.body)).toEqual({
            amount,
            identifier: paymentIdentifier,
        });
        tick(500);
        expect(emitted).toBe(true);

        const body = {
            target_address: targetAddress,
            identifier: paymentIdentifier,
        };
        request.flush(body, {
            status: 200,
            statusText: '',
        });
        flush();
    }));

    it('should give the tokens', fakeAsync(() => {
        const connection: Connection = {
            funds: new BigNumber(100),
            sum_deposits: new BigNumber(67),
            channels: 3,
        };
        const tokens = [Object.assign({}, token, { connected: connection })];
        retrieverSpy.and.returnValue(
            new Promise((resolve) => resolve({ [token.address]: token }))
        );

        service
            .getTokens(true)
            .subscribe((value) => expect(value).toEqual(tokens));
        tick(2000);

        const addressRequest = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET',
        });
        expect(losslessParse(addressRequest.request.body)).toBe(null);
        addressRequest.flush(
            { our_address: raidenAddress },
            {
                status: 200,
                statusText: '',
            }
        );

        const requestTokens = mockHttp.expectOne({
            url: `${endpoint}/tokens`,
            method: 'GET',
        });
        expect(losslessParse(requestTokens.request.body)).toBe(null);
        requestTokens.flush([token.address], {
            status: 200,
            statusText: '',
        });

        const requestConnections = mockHttp.expectOne({
            url: `${endpoint}/connections`,
            method: 'GET',
        });
        expect(losslessParse(requestConnections.request.body)).toBe(null);
        const requestConnectionsBody = {
            [token.address]: connection,
        };
        requestConnections.flush(losslessStringify(requestConnectionsBody), {
            status: 200,
            statusText: '',
        });

        flush();

        expect(retrieverSpy).toHaveBeenCalledTimes(1);
        expect(retrieverSpy).toHaveBeenCalledWith(
            [token.address],
            raidenAddress,
            // @ts-ignore
            service.userTokens
        );
    }));

    it('should return a Channel for a token and a partner', () => {
        const partnerAddress = channel1.partner_address;

        service.getChannel(token.address, partnerAddress).subscribe(
            (channel: Channel) => {
                expect(channel).toEqual(channel1);
            },
            (error) => {
                fail(error);
            }
        );

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/${partnerAddress}`,
            method: 'GET',
        });

        request.flush(losslessStringify(channel1), {
            status: 200,
            statusText: '',
        });
    });

    it('should inform the user when a channel has been closed successfully', () => {
        const channel3: Channel = createChannel({
            channel_identifier: new BigNumber(2),
            balance: new BigNumber(0),
            total_deposit: new BigNumber(10),
            total_withdraw: new BigNumber(10),
        });
        spyOn(service, 'getChannel').and.returnValue(
            of(Object.assign({}, channel3))
        );
        channel3.state = 'closed';

        service
            .closeChannel(token.address, channel3.partner_address)
            .subscribe(
                (channel: Channel) => {
                    expect(channel).toEqual(channel3);
                },
                (error) => {
                    fail(error);
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/${channel3.partner_address}`,
            method: 'PATCH',
        });

        expect(losslessParse(request.request.body)).toEqual({
            state: 'closed',
        });
        expect(notificationService.addPendingAction).toHaveBeenCalledTimes(1);

        request.flush(losslessStringify(channel3), {
            status: 200,
            statusText: '',
        });

        expect(
            notificationService.addSuccessNotification
        ).toHaveBeenCalledTimes(1);
    });

    it('should inform the user when closing a channel was not successful', () => {
        const channel3: Channel = createChannel({
            channel_identifier: new BigNumber(2),
            balance: new BigNumber(0),
            total_deposit: new BigNumber(10),
            total_withdraw: new BigNumber(10),
        });
        spyOn(service, 'getChannel').and.returnValue(
            of(Object.assign({}, channel3))
        );
        channel3.state = 'closed';

        service
            .closeChannel(token.address, channel3.partner_address)
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                (error) => {
                    expect(error).toBeTruthy('An error was expected');
                }
            )
            .add(() => {
                expect(
                    notificationService.removePendingAction
                ).toHaveBeenCalledTimes(1);
            });

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/${token.address}/${channel3.partner_address}`,
            method: 'PATCH',
        });

        const errorMessage = 'Channel is already closed';
        const errorBody = {
            errors: errorMessage,
        };
        request.flush(errorBody, {
            status: 400,
            statusText: '',
        });
        expect(notificationService.addErrorNotification).toHaveBeenCalledTimes(
            1
        );
    });

    it('should return the pending transfers with the user token included', () => {
        const pendingTransfer: PendingTransfer = {
            channel_identifier: new BigNumber(255),
            initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
            locked_amount: new BigNumber(119),
            payment_identifier: new BigNumber(1),
            role: 'initiator',
            target: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
            token_address: token.address,
            token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
            transferred_amount: new BigNumber(331),
        };
        spyOn(service, 'getTokens').and.returnValue(of([token]));

        service.getPendingTransfers().subscribe(
            (pendingTransfers: Array<PendingTransfer>) => {
                expect(pendingTransfers).toEqual([
                    Object.assign({}, pendingTransfer, { userToken: token }),
                ]);
            },
            (error) => {
                fail(error);
            }
        );

        const getPendingTransfersRequest = mockHttp.expectOne({
            url: `${endpoint}/pending_transfers`,
            method: 'GET',
        });

        getPendingTransfersRequest.flush(losslessStringify([pendingTransfer]), {
            status: 200,
            statusText: '',
        });
    });

    it('should mark channels deposit as pending while they are opened', fakeAsync(() => {
        spyOn(service, 'getTokens').and.returnValue(of([token]));
        const channel3: Channel = createChannel({
            channel_identifier: new BigNumber(2),
            balance: new BigNumber(0),
            total_deposit: new BigNumber(10),
            total_withdraw: new BigNumber(10),
            partner_address: '0xc52952ebad56f2c5e5b42bb881481ae27d036475',
            userToken: token,
        });

        service
            .openChannel(
                channel1.token_address,
                channel1.partner_address,
                500,
                new BigNumber(10)
            )
            .subscribe();
        const openChannelRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'PUT',
        });

        service.getChannels().subscribe((channels: Array<Channel>) => {
            channels.forEach((channel) => {
                if (
                    channel.channel_identifier.isEqualTo(
                        channel1.channel_identifier
                    )
                ) {
                    expect(channel.depositPending).toBe(true);
                } else {
                    expect(channel.depositPending).toBe(false);
                }
            });
        });
        const getChannelsRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'GET',
        });

        getChannelsRequest.flush(losslessStringify([channel1, channel3]), {
            status: 200,
            statusText: '',
        });
        tick();

        openChannelRequest.flush(losslessStringify(channel1), {
            status: 200,
            statusText: '',
        });
        flush();
    }));

    it('should refresh the raiden address', () => {
        const newAddress = '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7';
        let emittedTimes = 0;
        service.raidenAddress$.subscribe(
            (value) => {
                if (emittedTimes === 0) {
                    expect(value).toBe(raidenAddress);
                } else if (emittedTimes === 1) {
                    expect(value).toBe(newAddress);
                }
                emittedTimes++;
            },
            (error) => {
                fail(error);
            }
        );

        let request = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET',
        });
        request.flush(
            {
                our_address: raidenAddress,
            },
            {
                status: 200,
                statusText: '',
            }
        );

        service.reconnectSuccessful();

        request = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET',
        });
        request.flush(
            {
                our_address: newAddress,
            },
            {
                status: 200,
                statusText: '',
            }
        );

        expect(emittedTimes).toBe(2);
    });

    it('should emit a global retry when attempting to connect to the API', () => {
        let emitted = false;
        notificationService.apiError = new HttpErrorResponse({});
        service.globalRetry$.subscribe(
            () => {
                emitted = true;
            },
            (error) => {
                fail(error);
            }
        );
        service.attemptApiConnection();
        expect(emitted).toBe(true);
    });

    it('should give the pending channels', fakeAsync(() => {
        const partnerAddress = '0xc52952ebad56f2c5e5b42bb881481ae27d036475';
        service
            .openChannel(token.address, partnerAddress, 500, new BigNumber(10))
            .subscribe();
        const openChannelRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'PUT',
        });
        let emittedTimes = 0;

        service.getPendingChannels().subscribe((value) => {
            if (emittedTimes === 0) {
                expect(value).toEqual([
                    {
                        channel_identifier: new BigNumber(0),
                        state: 'waiting_for_open',
                        total_deposit: new BigNumber(0),
                        total_withdraw: new BigNumber(0),
                        balance: new BigNumber(0),
                        settle_timeout: 500,
                        reveal_timeout: 0,
                        token_address: token.address,
                        partner_address: partnerAddress,
                        depositPending: true,
                        userToken: token,
                    },
                ]);
            }
            if (emittedTimes === 1) {
                expect(value).toEqual([]);
            }
            emittedTimes++;
        });
        tick();

        openChannelRequest.flush(losslessStringify(channel1), {
            status: 200,
            statusText: '',
        });
        flush();
    }));

    it('should query the payment history', () => {
        const partnerAddress = '0xc52952ebad56f2c5e5b42bb881481ae27d036475';
        service.getPaymentHistory(token.address, partnerAddress).subscribe(
            (history: PaymentEvent[]) => {
                expect(history).toEqual([paymentEvent]);
            },
            (error) => {
                fail(error);
            }
        );

        const getPendingTransfersRequest = mockHttp.expectOne({
            url: `${endpoint}/payments/${token.address}/${partnerAddress}`,
            method: 'GET',
        });

        getPendingTransfersRequest.flush(losslessStringify([paymentEvent]), {
            status: 200,
            statusText: '',
        });
    });

    it('should query the payment history and use limit and offset parameters', () => {
        const limit = 5;
        const offset = 10;
        service
            .getPaymentHistory(undefined, undefined, limit, offset)
            .subscribe();

        mockHttp.expectOne({
            url: `${endpoint}/payments?limit=${limit}&offset=${offset}`,
            method: 'GET',
        });
    });

    it('should request the API to shutdown', () => {
        const spy = jasmine.createSpy();
        service.shutdownRaiden().subscribe(spy, (error) => {
            fail(error);
        });

        const shutdownRequest = mockHttp.expectOne({
            url: `${endpoint}/shutdown`,
            method: 'POST',
        });

        shutdownRequest.flush(losslessStringify({ status: 'shutdown' }), {
            status: 200,
            statusText: '',
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return the API status', () => {
        const spy = jasmine.createSpy();
        service.getStatus().subscribe(spy, (error) => {
            fail(error);
        });

        const statusRequest = mockHttp.expectOne({
            url: `${endpoint}/status`,
            method: 'GET',
        });

        statusRequest.flush(losslessStringify({ status: 'ready' }), {
            status: 200,
            statusText: '',
        });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ status: 'ready' });
    });

    it('should return the API status when syncing', () => {
        const spy = jasmine.createSpy();
        service.getStatus().subscribe(spy, (error) => {
            fail(error);
        });

        const statusRequest = mockHttp.expectOne({
            url: `${endpoint}/status`,
            method: 'GET',
        });

        statusRequest.flush(
            losslessStringify({ status: 'syncing', blocks_to_sync: '1000' }),
            {
                status: 200,
                statusText: '',
            }
        );
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({
            status: 'syncing',
            blocks_to_sync: 1000,
        });
    });

    it('should add the constant tokens to the userTokens on network change', () => {
        const tokenInfo: TokenInfo = {
            address: createAddress(),
            name: 'TestToken',
            symbol: 'TST',
            decimals: 18,
        };
        const network = createNetworkMock({ tokenConstants: [tokenInfo] });
        const raidenConfig = TestBed.inject(RaidenConfig) as MockConfig;
        raidenConfig.updateNetwork(network);
        expect(service.getUserToken(tokenInfo.address)).toEqual(
            Object.assign({ balance: new BigNumber(0) }, tokenInfo)
        );
    });

    it('should return the contracts addresses', () => {
        const contractsInfo = createContractsInfo();
        service
            .getContractsInfo()
            .subscribe((value) => expect(value).toEqual(contractsInfo));

        const request = mockHttp.expectOne({
            url: `${endpoint}/contracts`,
            method: 'GET',
        });

        request.flush(contractsInfo, {
            status: 200,
            statusText: '',
        });
    });
});
