import { HttpClientModule } from '@angular/common/http';
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

describe('RaidenService', () => {
    const tokenAddress = '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8';

    let mockHttp: HttpTestingController;
    let sharedService: SharedService;
    let endpoint: String;

    let service: RaidenService;

    let retrieverSpy: Spy;

    const channel1: Channel = createChannel({
        id: 1,
        balance: 0,
        totalDeposit: 10,
        totalWithdraw: 10
    });

    const channel2: Channel = createChannel({
        id: 2,
        balance: 0,
        totalDeposit: 10,
        totalWithdraw: 10
    });

    beforeEach(() => {
        sharedService = jasmine.createSpyObj('SharedService', [
            'error',
            'info'
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
                Web3Factory
            ]
        });

        mockHttp = TestBed.get(HttpTestingController);

        endpoint = TestBed.get(RaidenConfig).api;
        service = TestBed.get(RaidenService);

        retrieverSpy = spyOn(
            TestBed.get(TokenInfoRetrieverService),
            'createBatch'
        );
        // @ts-ignore
        spyOn(service, 'raidenAddress$').and.returnValue(
            of('0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C')
        );
    });

    afterEach(inject(
        [HttpTestingController],
        (backend: HttpTestingController) => {
            backend.verify();
        }
    ));

    it('When token creation fails there should be a nice message', () => {
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

        service.openChannel(tokenAddress, partnerAddress, 500, 10, 8).subscribe(
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
        const token: UserToken = {
            address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            symbol: 'TST',
            name: 'Test Suite Token',
            decimals: 8,
            balance: 20
        };

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
            our_address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
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
            id: 1,
            totalDeposit: 1000000,
            balance: 10,
            totalWithdraw: 0
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                '0xtkn',
                '0xpartn',
                0.0000001,
                18,
                DepositMode.DEPOSIT
            )
            .subscribe(value => {
                expect(value).toEqual(
                    createChannel({
                        id: 1,
                        totalWithdraw: 0,
                        totalDeposit: 100001000000,
                        balance: 100000000010
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

        expect(JSON.parse(request.request.body.total_deposit)).toEqual(
            100001000000
        );

        request.flush(body, {
            status: 200,
            statusText: ''
        });

        flush();

        expect(sharedService.info).toHaveBeenCalledTimes(1);
        expect(sharedService.info).toHaveBeenCalledWith({
            title: 'Deposit',
            description: `The channel 1 balance changed to 0.000000100000000010`
        });
    }));

    it('should inform the user when a withdraw was completed successfully', fakeAsync(() => {
        const channel = createChannel({
            id: 1,
            totalDeposit: 10,
            balance: 1000000000000,
            totalWithdraw: 1000000
        });
        spyOn(service, 'getChannel').and.returnValue(of(channel));

        service
            .modifyDeposit(
                '0xtkn',
                '0xpartn',
                0.000001,
                18,
                DepositMode.WITHDRAW
            )
            .subscribe(value => {
                expect(value).toEqual(
                    createChannel({
                        id: 1,
                        totalWithdraw: 1000001000000,
                        totalDeposit: 10,
                        balance: 0
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

        expect(JSON.parse(request.request.body.total_withdraw)).toEqual(
            1000001000000
        );

        request.flush(body, {
            status: 200,
            statusText: ''
        });

        flush();

        expect(sharedService.info).toHaveBeenCalledTimes(1);
        expect(sharedService.info).toHaveBeenCalledWith({
            title: 'Withdraw',
            description: `The channel 1 balance changed to 0.000000000000000000`
        });
    }));
});
