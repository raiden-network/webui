import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { scan, share, switchMap, tap } from 'rxjs/operators';
import { Channel } from '../models/channel';
import { amountToDecimal } from '../utils/amount.converter';
import { RaidenConfig } from './raiden.config';
import { RaidenService } from './raiden.service';
import { backoff } from '../shared/backoff.operator';
import BigNumber from 'bignumber.js';
import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';

@Injectable({
    providedIn: 'root'
})
export class ChannelPollingService {
    private channelsSubject: BehaviorSubject<void> = new BehaviorSubject(null);
    private refreshingSubject: BehaviorSubject<boolean> = new BehaviorSubject<
        boolean
    >(false);
    private readonly channels$: Observable<Channel[]>;
    private loaded = false;

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private raidenConfig: RaidenConfig
    ) {
        let timeout;
        this.channels$ = this.channelsSubject.pipe(
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
                this.checkForBalanceChanges(oldChannels, newChannels);
                this.checkForNewChannels(oldChannels, newChannels);
                return newChannels;
            }, []),
            backoff(
                this.raidenConfig.config.error_poll_interval,
                this.raidenService.globalRetry$
            ),
            share()
        );
    }

    public refreshing(): Observable<boolean> {
        return this.refreshingSubject;
    }

    public channels(): Observable<Channel[]> {
        return this.channels$;
    }

    public refresh() {
        this.channelsSubject.next(null);
    }

    private checkForNewChannels(
        oldChannels: Channel[],
        newChannels: Channel[]
    ) {
        if (oldChannels.length > 0) {
            const channels = newChannels.filter(newChannel => {
                return !oldChannels.find(oldChannel =>
                    this.isTheSameChannel(oldChannel, newChannel)
                );
            });

            for (const channel of channels) {
                this.informAboutNewChannel(channel);
            }
        } else if (
            this.loaded &&
            oldChannels.length === 0 &&
            newChannels.length > 0
        ) {
            for (const channel of newChannels) {
                this.informAboutNewChannel(channel);
            }
        }
        this.loaded = true;
    }

    private checkForBalanceChanges(
        oldChannels: Channel[],
        newChannels: Channel[]
    ) {
        for (const oldChannel of oldChannels) {
            const newChannel = newChannels.find(channel =>
                this.isTheSameChannel(oldChannel, channel)
            );
            if (
                !newChannel ||
                newChannel.balance.isLessThanOrEqualTo(oldChannel.balance)
            ) {
                continue;
            }
            this.informAboutBalanceUpdate(newChannel, oldChannel.balance);
        }
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
        const channelId = channel.channel_identifier;
        const partnerAddress = channel.partner_address;
        const network = channel.userToken.name;
        const message: UiMessage = {
            title: 'New channel',
            description: `A new channel (${channelId}) was opened with ${partnerAddress} in ${network} network`
        };

        this.notificationService.addInfoNotification(message);
    }

    private informAboutBalanceUpdate(
        channel: Channel,
        previousBalance: BigNumber
    ) {
        const amount = channel.balance.minus(previousBalance);
        const symbol = channel.userToken.symbol;
        const channelId = channel.channel_identifier;
        const partnerAddress = channel.partner_address;
        const balance = amountToDecimal(amount, channel.userToken.decimals);
        const formattedBalance = balance.toFixed();
        const message: UiMessage = {
            title: 'Balance Update',
            description: `The balance of channel ${channelId} with ${partnerAddress} was updated by ${formattedBalance} ${symbol}`
        };

        this.notificationService.addInfoNotification(message);
    }
}
