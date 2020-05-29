import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
<<<<<<< HEAD
import { switchMap, tap, shareReplay, scan, startWith } from 'rxjs/operators';
=======
import { switchMap, tap, shareReplay } from 'rxjs/operators';
>>>>>>> Only query new payment events after initial loading
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

    private readonly paymentHistorySubject: BehaviorSubject<
        void
    > = new BehaviorSubject(null);
    private queryOffset = 0;
    private loaded = false;

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
                this.updateNewPayments(newEvents);
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

    private updateNewPayments(history: PaymentEvent[]) {
        if (this.loaded) {
            history.forEach((event) =>{
                if (event.event === 'EventPaymentReceivedSuccess') {
                    this.informAboutNewReceivedPayment(event);
                }
            });
        }
        this.queryOffset += history.length;
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
}
