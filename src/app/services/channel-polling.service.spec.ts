import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, flush, inject, TestBed, tick } from '@angular/core/testing';
import { from, of, BehaviorSubject } from 'rxjs';
import { Channel } from '../models/channel';
import { ChannelPollingService } from './channel-polling.service';
import { RaidenService } from './raiden.service';
import Spy = jasmine.Spy;
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from './notification.service';
import { createToken, createChannel } from '../../testing/test-data';
import { AddressBookService } from './address-book.service';

describe('ChannelPollingService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                ChannelPollingService,
                NotificationService,
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
            ],
        });
    });

    let pollingService: ChannelPollingService;
    let notificationService: NotificationService;
    let raidenService: RaidenService;
    let raidenServiceSpy: Spy;
    const pendingChannelsSubject = new BehaviorSubject<Channel[]>([]);

    const token = createToken();
    const token2 = createToken({
        symbol: 'TST2',
        name: 'Test Suite Token 2',
    });
    const channel1 = createChannel({ userToken: token });
    const channel1Network2 = Object.assign({}, channel1, {
        userToken: token2,
        token_address: token2.address,
    });
    const channel1Updated = Object.assign({}, channel1, {
        balance: channel1.balance.plus(10),
    });
    const channel2 = createChannel({ userToken: token });

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ChannelPollingService,
                RaidenService,
                NotificationService,
                TestProviders.AddressBookStubProvider(),
            ],
        });

        raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getPendingChannels').and.returnValue(
            pendingChannelsSubject.asObservable()
        );

        notificationService = TestBed.inject(NotificationService);
        pollingService = TestBed.inject(ChannelPollingService);

        raidenServiceSpy = spyOn(raidenService, 'getChannels');
        spyOn(notificationService, 'addInfoNotification');
    });

    it('should be created', inject(
        [ChannelPollingService],
        (service: ChannelPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should not send notification about channel the first time loading the channels', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(from([[channel1], [channel1]]));
        const subscription = pollingService.channels$.subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should send a notification when user opens the first channel', fakeAsync(() => {
        const mockAddressBookService = TestBed.inject(AddressBookService);
        mockAddressBookService.get = () => ({
            [channel1.partner_address]: 'Test account',
        });
        raidenServiceSpy.and.returnValues(
            from([[], [], [channel1], [channel1]])
        );
        const subscription = pollingService.channels$.subscribe();
        tick();

        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should show notification if new channels are detected', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[], [channel1], [channel1, channel2]])
        );
        const subscription = pollingService.channels$.subscribe();

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
        const subscription = pollingService.channels$.subscribe();
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
        const subscription = pollingService.channels$.subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should show a notification for the same identifier on different network', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            from([[channel1], [channel1Network2]])
        );
        const subscription = pollingService.channels$.subscribe();
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            1
        );
        subscription.unsubscribe();
        flush();
    }));

    it('should respond with pending channels', () => {
        raidenServiceSpy.and.returnValue(of([channel1Updated]));
        pendingChannelsSubject.next([channel1, channel2]);
        pollingService.channels$.subscribe((channels: Channel[]) => {
            expect(channels).toEqual([channel1Updated, channel2]);
        });
    });

    it('should get updates for a channel', fakeAsync(() => {
        raidenServiceSpy.and.returnValues(
            of([channel1]),
            of([channel1Updated])
        );
        let emittedTimes = 0;
        const subscription = pollingService
            .getChannelUpdates(channel1)
            .subscribe((newChannel) => {
                if (emittedTimes < 1) {
                    expect(newChannel).toEqual(channel1);
                } else {
                    expect(newChannel).toEqual(channel1Updated);
                }
                emittedTimes++;
            });

        tick(5000);
        subscription.unsubscribe();
        flush();
    }));

    it('should not show notifications when reconnected', () => {
        raidenServiceSpy.and.returnValues(
            of([channel1]),
            of([channel1, channel2])
        );
        pollingService.channels$.subscribe();
        raidenService.reconnectSuccessful();
        expect(raidenServiceSpy).toHaveBeenCalledTimes(2);
        expect(notificationService.addInfoNotification).toHaveBeenCalledTimes(
            0
        );
    });
});
