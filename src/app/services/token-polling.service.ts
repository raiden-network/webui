import { Injectable } from '@angular/core';
import { RaidenService } from './raiden.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserToken } from '../models/usertoken';
import { tap, switchMap, shareReplay, startWith, map } from 'rxjs/operators';
import { backoff } from '../shared/backoff.operator';
import { RaidenConfig } from './raiden.config';

@Injectable({
    providedIn: 'root',
})
export class TokenPollingService {
    public readonly tokens$: Observable<UserToken[]>;

    private tokensSubject: BehaviorSubject<void> = new BehaviorSubject(null);
    private refreshingSubject: BehaviorSubject<boolean> = new BehaviorSubject<
        boolean
    >(false);

    constructor(
        private raidenService: RaidenService,
        private raidenConfig: RaidenConfig
    ) {
        let timeout;
        this.tokens$ = this.tokensSubject.pipe(
            tap(() => {
                clearTimeout(timeout);
                this.refreshingSubject.next(true);
            }),
            switchMap(() => this.raidenService.getTokens(true)),
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
}
