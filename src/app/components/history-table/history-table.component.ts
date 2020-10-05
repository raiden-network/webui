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
import { RaidenService } from '../../services/raiden.service';

export interface HistoryEvent extends PaymentEvent {
    pending?: boolean;
}

@Component({
    selector: 'app-history-table',
    templateUrl: './history-table.component.html',
    styleUrls: ['./history-table.component.scss'],
    animations: Animations.flyInOut,
})
export class HistoryTableComponent implements OnInit, OnDestroy {
    private static ITEMS_PER_PAGE = 4;

    @Input() showAll = false;

    visibleHistory: HistoryEvent[] = [];
    selectedToken: UserToken;
    currentPage = 0;
    numberOfPages = 0;

    private history: HistoryEvent[] = [];
    private searchFilter = '';
    private ngUnsubscribe = new Subject();

    constructor(
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private addressBookService: AddressBookService,
        private selectedTokenService: SelectedTokenService,
        private sharedService: SharedService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private raidenService: RaidenService
    ) {}

    ngOnInit() {
        combineLatest([
            this.paymentHistoryPollingService.getHistory(),
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
                this.currentPage = 0;
                this.updateVisibleEvents();
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchFilter = value;
                this.currentPage = 0;
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

    nextPage() {
        if (this.currentPage + 1 >= this.numberOfPages) {
            return;
        }
        this.currentPage += 1;
        this.updateVisibleEvents();
    }

    previousPage() {
        if (this.currentPage <= 0) {
            return;
        }
        this.currentPage -= 1;
        this.updateVisibleEvents();
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

    getUserToken(event: HistoryEvent): UserToken {
        return this.raidenService.getUserToken(event.token_address);
    }

    private addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }

    private updateVisibleEvents() {
        const filteredEvents = this.getFilteredEvents();
        this.numberOfPages = Math.ceil(
            filteredEvents.length / HistoryTableComponent.ITEMS_PER_PAGE
        );

        const visibleEvents: HistoryEvent[] = [];
        const start = this.currentPage * HistoryTableComponent.ITEMS_PER_PAGE;
        for (let i = filteredEvents.length - 1 - start; i >= 0; i--) {
            if (visibleEvents.length >= HistoryTableComponent.ITEMS_PER_PAGE) {
                break;
            }
            visibleEvents.push(filteredEvents[i]);
        }
        this.visibleHistory = visibleEvents;
    }

    private getFilteredEvents() {
        return this.history.filter(
            (event) =>
                this.matchesSearchFilter(event) &&
                !(
                    this.selectedToken &&
                    event.token_address !== this.selectedToken.address
                )
        );
    }

    private matchesSearchFilter(event: HistoryEvent): boolean {
        const keyword = this.searchFilter.toLocaleLowerCase();
        const partnerAddress = this.partnerAddress(event);

        let matchingToken = false;
        const userToken = this.getUserToken(event);
        if (userToken) {
            matchingToken = matchesToken(keyword, userToken);
        }

        let matchingContact = false;
        const partnerLabel = this.addressLabel(partnerAddress);
        if (partnerLabel) {
            const contact: Contact = {
                address: partnerAddress,
                label: partnerLabel,
            };
            matchingContact = matchesContact(this.searchFilter, contact);
        }

        const partner = partnerAddress.toLocaleLowerCase();
        const tokenAddress = event.token_address.toLocaleLowerCase();

        return (
            partner.indexOf(keyword) >= 0 ||
            tokenAddress.indexOf(keyword) >= 0 ||
            matchingToken ||
            matchingContact
        );
    }
}
