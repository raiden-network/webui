import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
    HttpClientTestingModule,
    HttpTestingController
} from '@angular/common/http/testing';
import { fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Channel } from '../models/channel';
import { UserToken } from '../models/usertoken';
import { RaidenConfig, Web3Factory } from './raiden.config';
import { RaidenService } from './raiden.service';
import { SharedService } from './shared.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { TestProviders } from '../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { DepositMode } from '../utils/helpers';
import { createChannel } from '../../testing/test-data';
import Spy = jasmine.Spy;
import { amountToDecimal, amountFromDecimal } from '../utils/amount.converter';
import { Connection } from '../models/connection';
import { LosslessJsonInterceptor } from './lossless-json.interceptor';
import {
    losslessParse,
    losslessStringify
} from '../utils/lossless-json.converter';

describe('RaidenService', () => {
    const tokenAddress = '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8';
    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20)
    };
    const raidenAddress = '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C';

    let mockHttp: HttpTestingController;
    let sharedService: SharedService;
    let endpoint: String;

    let service: RaidenService;

    let retrieverSpy: Spy;

    const channel1: Channel = createChannel({
        id: new BigNumber(1),
        balance: new BigNumber(0),
        totalDeposit: new BigNumber(10),
        totalWithdraw: new BigNumber(10)
    });

    const channel2: Channel = createChannel({
        id: new BigNumber(2),
        balance: new BigNumber(0),
        totalDeposit: new BigNumber(10),
        totalWithdraw: new BigNumber(10)
    });

    beforeEach(() => {
        sharedService = jasmine.createSpyObj('SharedService', [
            'error',
            'info',
            'success'
        ]);
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
                {
                    provide: SharedService,
                    useValue: sharedService
                },
                TokenInfoRetrieverService,
                Web3Factory,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: LosslessJsonInterceptor,
                    multi: true
                }
            ]
        });

        mockHttp = TestBed.get(HttpTestingController);

        endpoint = TestBed.get(RaidenConfig).api;
        service = TestBed.get(RaidenService);

        retrieverSpy = spyOn(
            TestBed.get(TokenInfoRetrieverService),
            'createBatch'
        );
    });

    afterEach(inject(
        [HttpTestingController],
        (backend: HttpTestingController) => {
            backend.verify();
        }
    ));

    it('should inform the user when token network creation was completed successfully', () => {
        service
            .registerToken(tokenAddress)
            .subscribe(value => expect(value).toBeFalsy());

        const request = mockHttp.expectOne({
            url: `${endpoint}/tokens/${tokenAddress}`,
            method: 'PUT'
        });
        expect(losslessParse(request.request.body)).toEqual({});

        request.flush(
            {
                token_network_address:
                    '0xc52952ebad56f2c5e5b42bb881481ae27d036475'
            },
            {
                status: 201,
                statusText: ''
            }
        );

        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Token registered',
            description: `Your token was successfully registered: ${tokenAddress}`
        });
    });

    it('When token network creation fails there should be a nice message', () => {
        service.registerToken(tokenAddress).subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error is expected');
            }
        );

        const registerRequest = mockHttp.expectOne({
            url: `${endpoint}/tokens/${tokenAddress}`,
            method: 'PUT'
        });

        const errorMessage = 'Token already registered';
        const errorBody = {
            errors: errorMessage
        };

        registerRequest.flush(errorBody, {
            status: 409,
            statusText: ''
        });

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(errorMessage);
    });

    it('Show a proper response when non-EIP addresses are passed in channel creation', () => {
        const partnerAddress = '0xc52952ebad56f2c5e5b42bb881481ae27d036475';

        service
            .openChannel(tokenAddress, partnerAddress, 500, new BigNumber(10))
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                error => {
                    expect(error).toBeTruthy('An error was expected');
                }
            );

        const openChannelRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'PUT'
        });

        const errorBody = {
            errors: { partner_address: ['Not a valid EIP55 encoded address'] }
        };

        openChannelRequest.flush(errorBody, {
            status: 409,
            statusText: ''
        });

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(
            'partner_address: Not a valid EIP55 encoded address'
        );
    });

    it('should have user token included in the channels', fakeAsync(() => {
        spyOn(service, 'getUserToken').and.returnValue(token);
        spyOn(service, 'getTokens').and.returnValue(of([token]));

        service.getChannels().subscribe(
            (channels: Array<Channel>) => {
                channels.forEach(value => {
                    expect(value.userToken).toBeTruthy(
                        'UserToken should not be null'
                    );
                    expect(value.userToken.address).toBe(token.address);
                });
            },
            error => {
                fail(error);
            }
        );

        const getChannelsRequest = mockHttp.expectOne({
            url: `${endpoint}/channels`,
            method: 'GET'
        });

        getChannelsRequest.flush([channel1, channel2], {
            status: 200,
            statusText: 'All good'
        });

        tick();
        flush();
    }));

    it('should show an info message if attempted connection is successful', fakeAsync(function() {
        const config: RaidenConfig = TestBed.get(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(true));

        service.attemptConnection();
        tick();
        expect(sharedService.info).toHaveBeenCalledTimes(1);
        expect(sharedService.info).toHaveBeenCalledWith({
            title: 'JSON RPC Connection',
            description: 'JSON-RPC connection established successfully'
        });
    }));

    it('should show an error message if attempted connection is unsuccessful', fakeAsync(function() {
        const config: RaidenConfig = TestBed.get(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.returnValue(Promise.resolve(false));

        service.attemptConnection();
        tick();
        expect(sharedService.error).toHaveBeenCalledTimes(1);
        expect(sharedService.error).toHaveBeenCalledWith({
            title: 'JSON RPC Connection',
            description: 'Could not establish a JSON-RPC connection'
        });
    }));

    it('should show an error message if attempted connection is load fails', fakeAsync(function() {
        const config: RaidenConfig = TestBed.get(RaidenConfig);
        const loadSpy = spyOn(config, 'load');
        loadSpy.and.callFake(() => Promise.reject(new Error('failed')));

        service.attemptConnection();
        tick();
        expect(sharedService.error).toHaveBeenCalledTimes(1);
        expect(sharedService.error).toHaveBeenCalledWith({
            title: 'JSON RPC Connection',
            description: 'Could not establish a JSON-RPC connection'
        });
    }));

    it('should periodically poll the balance', fakeAsync(function() {
        let count = 0;
        const config: RaidenConfig = TestBed.get(RaidenConfig);

        const eth = config.web3.eth;

        // @ts-ignore
        config.web3.eth = {
            getBalance(address: string): Promise<string> {
                return Promise.resolve(
                    new BigNumber('2000000000000000000').toString()
                );
            }
        };

        tick(15000);

        const subscription = service.balance$.subscribe(value => {
            expect(value).toEqual('2');
            count++;
        });

        const addressRequest = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET'
        });

        const body = {
            our_address: raidenAddress
        };

        addressRequest.flush(body, {
            status: 200,
            statusText: ''
        });

        flush();
        expect(count).toEqual(1);
        subscription.unsubscribe();
        config.web3.eth = eth;
    }));

    it('should notify the user when a deposit was complete successfully', fakeAsync(() => {
        const channel = createChannel({
            id: new BigNumber(1),
            totalDeposit: new BigNumber(1000000),
            balance: new BigNumber(10),
            totalWithdraw: new BigNumber(0)
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                '0xtkn',
                '0xpartn',
                new BigNumber(100000000000),
                DepositMode.DEPOSIT
            )
            .subscribe(value => {
                expect(value).toEqual(
                    createChannel({
                        id: new BigNumber(1),
                        totalWithdraw: new BigNumber(0),
                        totalDeposit: new BigNumber(100001000000),
                        balance: new BigNumber(100000000010)
                    })
                );
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/0xtkn/0xpartn`,
            method: 'PATCH'
        });

        const body = Object.assign({}, channel, {
            total_deposit: 100001000000,
            balance: 100000000010
        });

        expect(losslessParse(request.request.body)).toEqual({
            total_deposit: new BigNumber(100001000000)
        });

        request.flush(losslessStringify(body), {
            status: 200,
            statusText: ''
        });

        flush();

        expect(sharedService.info).toHaveBeenCalledTimes(1);
        expect(sharedService.info).toHaveBeenCalledWith({
            title: 'Deposit',
            description: `The channel 1 balance changed to 100000000010`
        });
    }));

    it('should inform the user when a withdraw was completed successfully', fakeAsync(() => {
        const channel = createChannel({
            id: new BigNumber(1),
            totalDeposit: new BigNumber(10),
            balance: new BigNumber(1000000000000),
            totalWithdraw: new BigNumber(1000000)
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                '0xtkn',
                '0xpartn',
                new BigNumber(1000000000000),
                DepositMode.WITHDRAW
            )
            .subscribe(value => {
                expect(value).toEqual(
                    createChannel({
                        id: new BigNumber(1),
                        totalWithdraw: new BigNumber(1000001000000),
                        totalDeposit: new BigNumber(10),
                        balance: new BigNumber(0)
                    })
                );
            });
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/channels/0xtkn/0xpartn`,
            method: 'PATCH'
        });

        const body = Object.assign({}, channel, {
            total_withdraw: 1000001000000,
            balance: 0
        });

        expect(losslessParse(request.request.body)).toEqual({
            total_withdraw: new BigNumber(1000001000000)
        });

        request.flush(losslessStringify(body), {
            status: 200,
            statusText: ''
        });

        flush();

        expect(sharedService.info).toHaveBeenCalledTimes(1);
        expect(sharedService.info).toHaveBeenCalledWith({
            title: 'Withdraw',
            description: `The channel 1 balance changed to 0`
        });
    }));

    it('should inform the user when minting was completed successfully', () => {
        service
            .mintToken(token, '0xto', new BigNumber(1000))
            .subscribe(value => expect(value).toBeFalsy());

        const request = mockHttp.expectOne({
            url: `${endpoint}/_testing/tokens/${token.address}/mint`,
            method: 'POST'
        });
        expect(losslessParse(request.request.body)).toEqual({
            to: '0xto',
            value: new BigNumber(1000)
        });

        request.flush(
            { transaction_hash: '0xabc' },
            {
                status: 200,
                statusText: ''
            }
        );

        const decimalValue = amountToDecimal(
            new BigNumber(1000),
            token.decimals
        );
        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Mint',
            description: `${decimalValue} ${
                token.symbol
            } have successfully been minted`
        });
    });

    it('should inform the user when minting was not successful', () => {
        service.mintToken(token, '0xto', new BigNumber(1000)).subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error was expected');
            }
        );

        const request = mockHttp.expectOne({
            url: `${endpoint}/_testing/tokens/${token.address}/mint`,
            method: 'POST'
        });

        const errorMessage = 'Token does not have a mint method';
        const errorBody = {
            errors: errorMessage
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(errorMessage);
    });

    it('should inform the user when joining a token network was successful', fakeAsync(() => {
        service
            .connectTokenNetwork(new BigNumber(1000), tokenAddress, true)
            .subscribe(value => expect(value).toBeFalsy());
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${tokenAddress}`,
            method: 'PUT'
        });
        expect(losslessParse(request.request.body)).toEqual({
            funds: new BigNumber(1000)
        });

        request.flush(
            {},
            {
                status: 204,
                statusText: ''
            }
        );
        flush();

        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Joined Token Network',
            description: `You have successfully joined the Network of Token ${tokenAddress}`
        });
    }));

    it('should inform the user when adding funds to a token network was successful', fakeAsync(() => {
        service
            .connectTokenNetwork(new BigNumber(1000), tokenAddress, false)
            .subscribe(value => expect(value).toBeFalsy());
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${tokenAddress}`,
            method: 'PUT'
        });
        expect(losslessParse(request.request.body)).toEqual({
            funds: new BigNumber(1000)
        });

        request.flush(
            {},
            {
                status: 204,
                statusText: ''
            }
        );
        flush();

        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Funds Added',
            description: `You successfully added funds to the Network of Token ${tokenAddress}`
        });
    }));

    it('should inform the user when joining a token network was not successful', fakeAsync(() => {
        service
            .connectTokenNetwork(new BigNumber(1000), tokenAddress, true)
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                error => {
                    expect(error).toBeTruthy('An error was expected');
                }
            );
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${tokenAddress}`,
            method: 'PUT'
        });

        const errorMessage = 'Insufficient balance';
        const errorBody = {
            errors: errorMessage
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });
        flush();

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(errorMessage);
    }));

    it('should inform the user when leaving a token network was successful', fakeAsync(() => {
        service
            .leaveTokenNetwork(token)
            .subscribe(value => expect(value).toBeFalsy());
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'DELETE'
        });
        expect(losslessParse(request.request.body)).toBe(null);

        request.flush(
            {},
            {
                status: 200,
                statusText: ''
            }
        );
        flush();

        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Left Token Network',
            description: `Successfully closed and settled all channels in ${
                token.name
            } <${token.address}> token`
        });
    }));

    it('should inform the user when leaving a token network was not successful', fakeAsync(() => {
        service.leaveTokenNetwork(token).subscribe(
            () => {
                fail('On next should not be called');
            },
            error => {
                expect(error).toBeTruthy('An error was expected');
            }
        );
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/connections/${token.address}`,
            method: 'DELETE'
        });

        const errorMessage = 'Not a valid token network address';
        const errorBody = {
            errors: errorMessage
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });
        flush();

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(errorMessage);
    }));

    it('should inform the user when a payment was successful', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        const paymentIdentifier = new BigNumber(3);
        service
            .initiatePayment(
                tokenAddress,
                targetAddress,
                amount,
                paymentIdentifier
            )
            .subscribe(value => expect(value).toBeFalsy());
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${tokenAddress}/${targetAddress}`,
            method: 'POST'
        });
        expect(losslessParse(request.request.body)).toEqual({
            amount,
            identifier: paymentIdentifier
        });

        const body = {
            target_address: targetAddress,
            identifier: paymentIdentifier
        };

        request.flush(body, {
            status: 200,
            statusText: ''
        });
        flush();

        expect(sharedService.success).toHaveBeenCalledTimes(1);
        expect(sharedService.success).toHaveBeenCalledWith({
            title: 'Transfer successful',
            description: `A payment of ${amount.toString()} was successfully sent to the partner ${targetAddress}`
        });
    }));

    it('should set a payment identifier for a payment when none is passed', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        spyOnProperty(service, 'identifier', 'get').and.returnValue(50);
        service
            .initiatePayment(tokenAddress, targetAddress, amount)
            .subscribe();
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${tokenAddress}/${targetAddress}`,
            method: 'POST'
        });
        expect(losslessParse(request.request.body)).toEqual({
            amount,
            identifier: new BigNumber(50)
        });
        flush();
    }));

    it('should inform the user when a payment was not successful', fakeAsync(() => {
        const targetAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        const amount = new BigNumber(10);
        const paymentIdentifier = new BigNumber(3);
        service
            .initiatePayment(
                tokenAddress,
                targetAddress,
                amount,
                paymentIdentifier
            )
            .subscribe(
                () => {
                    fail('On next should not be called');
                },
                error => {
                    expect(error).toBeTruthy('An error was expected');
                }
            );
        tick();

        const request = mockHttp.expectOne({
            url: `${endpoint}/payments/${tokenAddress}/${targetAddress}`,
            method: 'POST'
        });

        const errorMessage = 'Payment was not successful';
        const errorBody = {
            errors: errorMessage
        };

        request.flush(errorBody, {
            status: 400,
            statusText: ''
        });
        flush();

        expect(sharedService.error).toHaveBeenCalledTimes(1);

        // @ts-ignore
        const payload = sharedService.error.calls.first().args[0];

        expect(payload.title).toBe(
            'Raiden Error',
            'It should be a Raiden Error'
        );
        expect(payload.description).toBe(errorMessage);
    }));

    it('should give the tokens', fakeAsync(() => {
        const connection: Connection = {
            funds: new BigNumber(100),
            sum_deposits: new BigNumber(67),
            channels: 3
        };
        const tokens = [Object.assign({}, token, { connected: connection })];
        retrieverSpy.and.returnValue(
            new Promise(resolve => resolve({ [token.address]: token }))
        );

        service
            .getTokens(true)
            .subscribe(value => expect(value).toEqual(tokens));
        tick(2000);

        const addressRequest = mockHttp.expectOne({
            url: `${endpoint}/address`,
            method: 'GET'
        });
        expect(losslessParse(addressRequest.request.body)).toBe(null);
        addressRequest.flush(
            { our_address: raidenAddress },
            {
                status: 200,
                statusText: ''
            }
        );

        const requestTokens = mockHttp.expectOne({
            url: `${endpoint}/tokens`,
            method: 'GET'
        });
        expect(losslessParse(requestTokens.request.body)).toBe(null);
        requestTokens.flush([token.address], {
            status: 200,
            statusText: ''
        });

        const requestConnections = mockHttp.expectOne({
            url: `${endpoint}/connections`,
            method: 'GET'
        });
        expect(losslessParse(requestConnections.request.body)).toBe(null);
        const requestConnectionsBody = {
            [token.address]: connection
        };
        requestConnections.flush(losslessStringify(requestConnectionsBody), {
            status: 200,
            statusText: ''
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
});
