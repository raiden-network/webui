import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap, shareReplay, scan } from 'rxjs/operators';
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
    readonly paymentHistory$: Observable<PaymentEvent[]>;

    private readonly paymentHistorySubject: BehaviorSubject<
        void
    > = new BehaviorSubject(null);
    private loaded = false;

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private raidenConfig: RaidenConfig,
        private addressBookService: AddressBookService
    ) {
        let timeout;
        this.paymentHistory$ = this.paymentHistorySubject.pipe(
            tap(() => {
                clearTimeout(timeout);
            }),
            switchMap(() => this.raidenService.getPaymentHistory()),
            tap(() => {
                timeout = setTimeout(
                    () => this.refresh(),
                    this.raidenConfig.config.poll_interval
                );
            }),
            scan((oldHistory: PaymentEvent[], newHistory: PaymentEvent[]) => {
                this.checkForNewPayments(oldHistory, newHistory);
                return newHistory;
            }, []),
            backoff(
                this.raidenConfig.config.error_poll_interval,
                this.raidenService.globalRetry$
            ),
            shareReplay({ refCount: true, bufferSize: 1 })
        );
    }

    refresh() {
        this.paymentHistorySubject.next(null);
    }

    private checkForNewPayments(
        oldHistory: PaymentEvent[],
        newHistory: PaymentEvent[]
    ) {
        if (this.loaded) {
            const oldLastIndex = oldHistory.length - 1;
            for (let i = newHistory.length - 1; i > oldLastIndex; i--) {
                if (newHistory[i].event === 'EventPaymentReceivedSuccess') {
                    this.informAboutNewReceivedPayment(newHistory[i]);
                }
            }
        }
        this.loaded = true;
    }

    private informAboutNewReceivedPayment(event: PaymentEvent) {
        const token = this.raidenService.getUserToken(event.token_address);
        const formattedAmount = amountToDecimal(event.amount, token.decimals);
        const initiatorAddress = event.initiator;
        let initiatorLabel = this.addressBookService.get()[initiatorAddress];
        if (!initiatorLabel) {
            initiatorLabel = '';
        }
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
