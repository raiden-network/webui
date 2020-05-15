import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { PaymentHistoryPollingService } from '../../services/payment-history-polling.service';
import { Subject, combineLatest } from 'rxjs';
import { PaymentEvent } from '../../models/payment-event';
import { AddressBookService } from '../../services/address-book.service';
import { Animations } from '../../animations/animations';
import { SelectedTokenService } from '../../services/selected-token.service';
import { UserToken } from '../../models/usertoken';
import { SharedService } from '../../services/shared.service';
import { matchesToken, matchesContact } from '../../shared/keyword-matcher';
import { Contact } from '../../models/contact';
import { takeUntil, map } from 'rxjs/operators';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';

export interface HistoryEvent extends PaymentEvent {
    pending?: boolean;
}

@Component({
    selector: 'app-history-table',
    templateUrl: './history-table.component.html',
    styleUrls: ['./history-table.component.css'],
    animations: Animations.flyInOut,
})
export class HistoryTableComponent implements OnInit, OnDestroy {
    @Input() showAll = false;

    visibleHistory: HistoryEvent[] = [];
    selectedToken: UserToken;

    private history: HistoryEvent[] = [];
    private searchFilter = '';
    private ngUnsubscribe = new Subject();

    constructor(
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private addressBookService: AddressBookService,
        private selectedTokenService: SelectedTokenService,
        private sharedService: SharedService,
        private pendingTransferPollingService: PendingTransferPollingService
    ) {}

    ngOnInit() {
        combineLatest([
            this.paymentHistoryPollingService.paymentHistory$,
            this.pendingTransferPollingService.pendingTransfers$,
        ])
            .pipe(
                map(([paymentEvents, pendingTransfers]) => {
                    const pendingEvents: HistoryEvent[] = pendingTransfers.map(
                        (pendingTransfer) => {
                            const initiator =
                                pendingTransfer.role === 'initiator';
                            const event: HistoryEvent = {
                                target: pendingTransfer.target,
                                initiator: pendingTransfer.initiator,
                                event: initiator
                                    ? 'EventPaymentSentSuccess'
                                    : 'EventPaymentReceivedSuccess',
                                amount: pendingTransfer.locked_amount,
                                identifier: pendingTransfer.payment_identifier,
                                log_time: '',
                                token_address: pendingTransfer.token_address,
                                userToken: pendingTransfer.userToken,
                                pending: true,
                            };
                            return event;
                        }
                    );
                    return paymentEvents.concat(pendingEvents);
                }),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((events) => {
                this.history = events;
                this.updateVisibleEvents();
            });

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token: UserToken) => {
                this.selectedToken = token;
                this.updateVisibleEvents();
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchFilter = value;
                this.updateVisibleEvents();
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    trackByFn(index, item: HistoryEvent) {
        return `${item.log_time}_${item.identifier}_${item.token_address}_${item.initiator}_${item.target}`;
    }

    paymentPartner(event: HistoryEvent): string {
        const partnerAddress = this.partnerAddress(event);
        return this.addressLabel(partnerAddress) ?? partnerAddress;
    }

    partnerAddress(event: HistoryEvent): string {
        if (this.isReceivedEvent(event)) {
            return event.initiator;
        }
        return event.target;
    }

    getUTCTimeString(event: HistoryEvent): string {
        return event.log_time + 'Z';
    }

    isReceivedEvent(event: HistoryEvent): boolean {
        return event.event === 'EventPaymentReceivedSuccess';
    }

    private addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }

    private updateVisibleEvents() {
        const events = this.history;
        const visibleEvents: HistoryEvent[] = [];
        for (let i = events.length - 1; i >= 0; i--) {
            if (!this.showAll && visibleEvents.length >= 4) {
                break;
            }

            const event = events[i];
            if (
                event.event === 'EventPaymentSentFailed' ||
                (this.selectedToken &&
                    event.token_address !== this.selectedToken.address) ||
                !this.matchesSearchFilter(event)
            ) {
                continue;
            }

            visibleEvents.push(event);
        }
        this.visibleHistory = visibleEvents;
    }

    private matchesSearchFilter(event: HistoryEvent): boolean {
        const keyword = this.searchFilter.toLocaleLowerCase();
        const paymentPartner = this.paymentPartner(event);

        let matchingToken = false;
        if (event.userToken) {
            matchingToken = matchesToken(keyword, event.userToken);
        }

        let matchingContact = false;
        const partnerLabel = this.addressLabel(paymentPartner);
        if (partnerLabel) {
            const contact: Contact = {
                address: paymentPartner,
                label: partnerLabel,
            };
            matchingContact = matchesContact(this.searchFilter, contact);
        }

        const partner = paymentPartner.toLocaleLowerCase();
        const tokenAddress = event.token_address.toLocaleLowerCase();

        return (
            partner.indexOf(keyword) >= 0 ||
            tokenAddress.indexOf(keyword) >= 0 ||
            matchingToken ||
            matchingContact
        );
    }
}
