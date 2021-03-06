import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import {
    scan,
    switchMap,
    tap,
    map,
    shareReplay,
    startWith,
} from 'rxjs/operators';
import { Channel } from '../models/channel';
import { RaidenConfig } from './raiden.config';
import { RaidenService } from './raiden.service';
import { backoff } from '../shared/backoff.operator';
import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';
import { AddressBookService } from './address-book.service';

@Injectable({
    providedIn: 'root',
})
export class ChannelPollingService {
    public readonly channels$: Observable<Channel[]>;

    private channelsSubject: BehaviorSubject<void> = new BehaviorSubject(null);
    private refreshingSubject: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);
    private loaded = false;

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private raidenConfig: RaidenConfig,
        private addressBookService: AddressBookService
    ) {
        this.raidenService.reconnected$.subscribe(() => {
            this.loaded = false;
            this.refresh();
        });

        let timeout;
        const channels$ = this.channelsSubject.pipe(
            tap(() => {
                clearTimeout(timeout);
                this.refreshingSubject.next(true);
            }),
            switchMap(() => this.raidenService.getChannels()),
            tap(() => {
                timeout = setTimeout(
                    () => this.refresh(),
                    this.raidenConfig.config.poll_interval
                );
                this.refreshingSubject.next(false);
            }),
            scan((oldChannels: Channel[], newChannels: Channel[]) => {
                this.checkForNewChannels(oldChannels, newChannels);
                return newChannels;
            }, []),
            startWith([]),
            backoff(
                this.raidenConfig.config.error_poll_interval,
                this.raidenService.globalRetry$
            )
        );

        this.channels$ = combineLatest([
            channels$,
            this.raidenService.getPendingChannels(),
        ]).pipe(
            map(([channels, pendingChannels]) => {
                const uniquePendingChannels = pendingChannels.filter(
                    (pendingChannel) =>
                        !channels.find(
                            (channel) =>
                                channel.partner_address ===
                                    pendingChannel.partner_address &&
                                channel.token_address ===
                                    pendingChannel.token_address
                        )
                );
                return channels.concat(uniquePendingChannels);
            }),
            shareReplay({ refCount: true, bufferSize: 1 })
        );
    }

    public refreshing(): Observable<boolean> {
        return this.refreshingSubject;
    }

    public refresh() {
        this.channelsSubject.next(null);
    }

    public getChannelUpdates(channel: Channel): Observable<Channel> {
        return this.channels$.pipe(
            map((channels) => {
                const updatedChannel = channels.find((newChannel) =>
                    this.isTheSameChannel(channel, newChannel)
                );
                return updatedChannel;
            })
        );
    }

    private checkForNewChannels(
        oldChannels: Channel[],
        newChannels: Channel[]
    ) {
        if (this.loaded) {
            const channels = newChannels.filter(
                (newChannel) =>
                    !oldChannels.find((oldChannel) =>
                        this.isTheSameChannel(oldChannel, newChannel)
                    )
            );

            for (const channel of channels) {
                this.informAboutNewChannel(channel);
            }
        }
        this.loaded = true;
    }

    // noinspection JSMethodCanBeStatic
    private isTheSameChannel(channel1: Channel, channel2: Channel): boolean {
        return (
            channel1.channel_identifier.isEqualTo(
                channel2.channel_identifier
            ) && channel1.token_address === channel2.token_address
        );
    }

    private informAboutNewChannel(channel: Channel) {
        const token = channel.userToken;
        const partnerAddress = channel.partner_address;
        let partnerLabel = this.addressBookService.get()[partnerAddress];
        if (!partnerLabel) {
            partnerLabel = '';
        }
        const message: UiMessage = {
            title: 'New channel',
            description: `${token.symbol} with ${partnerLabel} ${partnerAddress}`,
            icon: 'channel',
            identiconAddress: partnerAddress,
            userToken: token,
        };

        this.notificationService.addInfoNotification(message);
    }
}
