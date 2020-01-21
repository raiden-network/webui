import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaymentHistoryPollingService } from '../../services/payment-history-polling.service';
import { combineLatest, Subscription } from 'rxjs';
import { PaymentEvent } from '../../models/payment-event';
import { map, tap } from 'rxjs/operators';
import { AddressBookService } from '../../services/address-book.service';
import { RaidenService } from '../../services/raiden.service';
import { Animations } from '../../animations/animations';
import { SelectedTokenService } from '../../services/selected-token.service';
import { UserToken } from '../../models/usertoken';

@Component({
    selector: 'app-history-table',
    templateUrl: './history-table.component.html',
    styleUrls: ['./history-table.component.css'],
    animations: Animations.flyInOut
})
export class HistoryTableComponent implements OnInit, OnDestroy {
    history: PaymentEvent[] = [];
    selectedToken: UserToken;

    private subscription: Subscription;

    constructor(
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private addressBookService: AddressBookService,
        private raidenService: RaidenService,
        private selectedTokenService: SelectedTokenService
    ) {}

    ngOnInit() {
        const selectedToken$ = this.selectedTokenService.selectedToken$.pipe(
            tap(token => {
                this.selectedToken = token;
            })
        );

        this.subscription = combineLatest([
            this.paymentHistoryPollingService.paymentHistory$,
            selectedToken$
        ])
            .pipe(
                map(([events, token]) => {
                    const visibleEvents: PaymentEvent[] = [];
                    for (let i = events.length - 1; i >= 0; i--) {
                        if (visibleEvents.length > 3) {
                            break;
                        }

                        const event = events[i];
                        if (
                            event.event === 'EventPaymentSentFailed' ||
                            (!!token && event.token_address !== token.address)
                        ) {
                            continue;
                        }

                        event.userToken = this.raidenService.getUserToken(
                            event.token_address
                        );
                        visibleEvents.push(event);
                    }
                    return visibleEvents;
                })
            )
            .subscribe(events => {
                this.history = events;
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    trackByFn(index, item: PaymentEvent) {
        return item.log_time;
    }

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }

    paymentPartner(event: PaymentEvent): string {
        if (event.event === 'EventPaymentReceivedSuccess') {
            return event.initiator;
        }
        return event.target;
    }

    getUTCTimeString(event: PaymentEvent): string {
        return event.log_time + 'Z';
    }

    tokenSymbol(event: PaymentEvent): string {
        const token = this.raidenService.getUserToken(event.token_address);
        return token.symbol;
    }
}
