import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap, shareReplay, startWith } from 'rxjs/operators';
import { RaidenConfig } from './raiden.config';
import { RaidenService } from './raiden.service';
import { backoff } from '../shared/backoff.operator';
import { PaymentEvent } from '../models/payment-event';
import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';
import { amountToDecimal } from '../utils/amount.converter';
import { AddressBookService } from './address-book.service';

@Injectable({
    providedIn: 'root',
})
export class PaymentHistoryPollingService {
    readonly newPaymentEvents$: Observable<PaymentEvent[]>;

    private readonly paymentHistorySubject: BehaviorSubject<void> =
        new BehaviorSubject(null);
    private queryOffset = 0;
    private loaded = false;
    private tokenUsage: { [tokenAddress: string]: number } = {};
    private paymentTargetUsage: { [targetAddress: string]: number } = {};

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private raidenConfig: RaidenConfig,
        private addressBookService: AddressBookService
    ) {
        this.raidenService.reconnected$.subscribe(() => {
            this.queryOffset = 0;
            this.loaded = false;
            this.refresh();
        });

        let timeout;
        this.newPaymentEvents$ = this.paymentHistorySubject.pipe(
            tap(() => {
                clearTimeout(timeout);
            }),
            switchMap(() =>
                this.raidenService.getPaymentHistory(
                    undefined,
                    undefined,
                    undefined,
                    this.queryOffset
                )
            ),
            tap((newEvents: PaymentEvent[]) => {
                timeout = setTimeout(
                    () => this.refresh(),
                    this.raidenConfig.config.poll_interval
                );
                this.checkNewPayments(newEvents);
            }),
            startWith([]),
            backoff(
                this.raidenConfig.config.error_poll_interval,
                this.raidenService.globalRetry$
            ),
            shareReplay(1)
        );
    }

    refresh() {
        this.paymentHistorySubject.next(null);
    }

    getHistory(
        tokenAddress?: string,
        partnerAddress?: string,
        limit?: number,
        offset?: number
    ): Observable<PaymentEvent[]> {
        return this.paymentHistorySubject.pipe(
            switchMap(() =>
                this.raidenService.getPaymentHistory(
                    tokenAddress,
                    partnerAddress,
                    limit,
                    offset
                )
            )
        );
    }

    getTokenUsage(tokenAddress: string): number {
        return this.tokenUsage[tokenAddress];
    }

    getPaymentTargetUsage(targetAddress: string): number {
        return this.paymentTargetUsage[targetAddress];
    }

    private checkNewPayments(events: PaymentEvent[]) {
        events.forEach((event) => {
            if (this.loaded && event.event === 'EventPaymentReceivedSuccess') {
                this.informAboutNewReceivedPayment(event);
            } else if (event.event === 'EventPaymentSentSuccess') {
                this.updateUsageInformation(event);
            }
        });
        this.queryOffset += events.length;
        this.loaded = true;
    }

    private informAboutNewReceivedPayment(event: PaymentEvent) {
        const token = this.raidenService.getUserToken(event.token_address);
        const formattedAmount = amountToDecimal(event.amount, token.decimals);
        const initiatorAddress = event.initiator;
        const initiatorLabel =
            this.addressBookService.get()[initiatorAddress] ?? '';
        const message: UiMessage = {
            title: 'Received transfer',
            description: `${formattedAmount} ${token.symbol} from ${initiatorLabel} ${event.initiator}`,
            icon: 'received',
            identiconAddress: initiatorAddress,
            userToken: token,
        };
        this.notificationService.addInfoNotification(message);
    }

    private updateUsageInformation(event: PaymentEvent) {
        if (!this.tokenUsage[event.token_address]) {
            this.tokenUsage[event.token_address] = 1;
        } else {
            this.tokenUsage[event.token_address] += 1;
        }

        if (!this.paymentTargetUsage[event.target]) {
            this.paymentTargetUsage[event.target] = 1;
        } else {
            this.paymentTargetUsage[event.target] += 1;
        }
    }
}
