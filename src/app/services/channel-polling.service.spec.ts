import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { from } from 'rxjs';
import { Channel } from '../models/channel';
import { UserToken } from '../models/usertoken';

import { ChannelPollingService } from './channel-polling.service';
import { RaidenService } from './raiden.service';
import Spy = jasmine.Spy;
import { TestProviders } from '../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';

describe('ChannelPollingService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                ChannelPollingService,
                NotificationService,
                TestProviders.MockRaidenConfigProvider(),
                RaidenService
            ]
        });
    });

    let pollingService: ChannelPollingService;
    let notificationService: NotificationService;
    let raidenService: RaidenService;
    let raidenServiceSpy: Spy;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        balance: new BigNumber(20),
        decimals: 8
    };

    const token2: UserToken = {
        address: '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195',
        symbol: 'TST2',
        name: 'Test Suite Token 2',
        balance: new BigNumber(20),
        decimals: 8
    };

    const channel1: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(1),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0x774aFb0652ca2c711fD13e6E9d51620568f6Ca82',
        reveal_timeout: 600,
        balance: new BigNumber(10),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel1Network2: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(1),
        token_address: '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195',
        partner_address: '0x774aFb0652ca2c711fD13e6E9d51620568f6Ca82',
        reveal_timeout: 600,
        balance: new BigNumber(20),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token2
    };

    const channel1Updated: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(1),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0x774aFb0652ca2c711fD13e6E9d51620568f6Ca82',
        reveal_timeout: 600,
        balance: new BigNumber(20),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel1UpdatedNegative: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(1),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0x774aFb0652ca2c711fD13e6E9d51620568f6Ca82',
        reveal_timeout: 600,
        balance: new BigNumber(5),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel2: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(2),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0xFC57d325f23b9121a8488fFdE2E6b3ef1208a20b',
        reveal_timeout: 600,
        balance: new BigNumber(0),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ChannelPollingService,
                RaidenService,
                NotificationService
            ]
        });

        raidenService = TestBed.get(RaidenService);
        notificationService = TestBed.get(NotificationService);
        pollingService = TestBed.get(ChannelPollingService);

        raidenServiceSpy = spyOn(raidenService, 'getChannels');
        spyOn(notificationService, 'addInfoNotification').and.callFake(
            () => {}
        );
    });

    it('should be created', inject(
        [ChannelPollingService],
        (service: ChannelPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should show a notification on balance increases', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[channel1], [channel1Updated]])
        );
        const subscription = pollingService.channels().subscribe();

        const notificationMessage: UiMessage = {
            title: 'Balance Update',
            description: `The balance of channel ${
                channel1.channel_identifier
            } with ${channel1.partner_address} was updated by 0.00000010 ${
                channel1.userToken.symbol
            } tokens`
        };
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addInfoNotification).toHaveBeenCalledWith(
            notificationMessage
        );

        subscription.unsubscribe();
        flush();
    }));

    it('should not show a notification on when balance is reduced', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[channel1], [channel1UpdatedNegative]])
        );
        const subscription = pollingService.channels().subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should not send notification about channel the first time loading the channels', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(from([[channel1], [channel1]]));
        const subscription = pollingService.channels().subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should send a notification when user opens the first channel', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[], [], [channel1], [channel1]])
        );
        const subscription = pollingService.channels().subscribe();
        tick();

        const notificationMessage: UiMessage = {
            title: 'New channel',
            description: `A new channel: ${
                channel1.channel_identifier
            } was opened with ${channel1.partner_address} on ${
                channel1.userToken.name
            }`
        };
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );
        expect(notificationService.addInfoNotification).toHaveBeenCalledWith(
            notificationMessage
        );

        subscription.unsubscribe();
        flush();
    }));

    it('should show notification if new channels are detected', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[], [channel1], [channel1, channel2]])
        );
        const subscription = pollingService.channels().subscribe();

        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            2
        );
        // @ts-ignore
        const payload = notificationService.addInfoNotification.calls.first()
            .args[0];
        expect(payload.title).toBe('New channel');
        subscription.unsubscribe();
        flush();
    }));

    it('should not show a notification if no new channels are detected', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(from([[channel1], [channel1]]));
        const subscription = pollingService.channels().subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should not throw if a channel is removed from the list', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[channel1, channel2], [channel1]])
        );
        const subscription = pollingService.channels().subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should not show a notification for the same identifier on different network', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[channel1, channel1Network2], [channel1Network2]])
        );
        const subscription = pollingService.channels().subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));
});
