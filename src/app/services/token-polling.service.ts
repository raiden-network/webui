import { Injectable } from '@angular/core';
import { RaidenService } from './raiden.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { UserToken } from '../models/usertoken';
import { tap, switchMap, shareReplay, startWith, map } from 'rxjs/operators';
import { backoff } from '../shared/backoff.operator';
import { RaidenConfig } from './raiden.config';
import { ChannelPollingService } from './channel-polling.service';
import { Channel } from '../models/channel';
import BigNumber from 'bignumber.js';
import { TokenUtils } from '../utils/token.utils';
import { PaymentHistoryPollingService } from './payment-history-polling.service';

@Injectable({
    providedIn: 'root',
})
export class TokenPollingService {
    public readonly tokens$: Observable<UserToken[]>;

    private tokensSubject: BehaviorSubject<void> = new BehaviorSubject(null);
    private refreshingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
        false
    );

    constructor(
        private raidenService: RaidenService,
        private raidenConfig: RaidenConfig,
        private channelPollingService: ChannelPollingService,
        private paymentHistoryPollingService: PaymentHistoryPollingService
    ) {
        let timeout;
        this.tokens$ = this.tokensSubject.pipe(
            tap(() => {
                clearTimeout(timeout);
                this.refreshingSubject.next(true);
            }),
            switchMap(() =>
                combineLatest([
                    this.raidenService.getTokens(true),
                    this.channelPollingService.channels$,
                ])
            ),
            map(([tokens, channels]) =>
                this.calculateSumOfBalances(tokens, channels).sort((a, b) => {
                    const aUsage =
                        this.paymentHistoryPollingService.getTokenUsage(
                            a.address
                        ) ?? 0;
                    const bUsage =
                        this.paymentHistoryPollingService.getTokenUsage(
                            b.address
                        ) ?? 0;
                    return TokenUtils.compareTokens(a, b, aUsage, bUsage);
                })
            ),
            tap(() => {
                timeout = setTimeout(
                    () => this.refresh(),
                    this.raidenConfig.config.poll_interval
                );
                this.refreshingSubject.next(false);
            }),
            startWith([]),
            backoff(
                this.raidenConfig.config.error_poll_interval,
                this.raidenService.globalRetry$
            ),
            shareReplay({ refCount: true, bufferSize: 1 })
        );
    }

    public refreshing(): Observable<boolean> {
        return this.refreshingSubject;
    }

    public refresh() {
        this.tokensSubject.next(null);
    }

    public getTokenUpdates(tokenAddress: string): Observable<UserToken> {
        return this.tokens$.pipe(
            map((tokens) => {
                const updatedToken = tokens.find(
                    (newToken) => tokenAddress === newToken.address
                );
                return updatedToken;
            })
        );
    }

    private calculateSumOfBalances(
        tokens: UserToken[],
        channels: Channel[]
    ): UserToken[] {
        const summedBalances: { [tokenAddress: string]: BigNumber } = {};

        channels.forEach((channel) => {
            const tokenAddress = channel.token_address;
            if (!summedBalances[tokenAddress]) {
                summedBalances[tokenAddress] = channel.balance;
                return;
            }
            summedBalances[tokenAddress] = summedBalances[tokenAddress].plus(
                channel.balance
            );
        });

        Object.entries(summedBalances).forEach(([tokenAddress, balance]) => {
            const token = tokens.find((item) => tokenAddress === item.address);
            if (token) {
                token.sumChannelBalances = balance;
            }
        });
        return tokens;
    }
}
