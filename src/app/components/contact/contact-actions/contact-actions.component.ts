import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Contact } from '../../../models/contact';
import { flatMap, first } from 'rxjs/operators';
import { ChannelPollingService } from '../../../services/channel-polling.service';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { EMPTY, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RaidenService } from '../../../services/raiden.service';
import { AddressBookService } from '../../../services/address-book.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { SelectedTokenService } from '../../../services/selected-token.service';

@Component({
    selector: 'app-contact-actions',
    templateUrl: './contact-actions.component.html',
    styleUrls: ['./contact-actions.component.css']
})
export class ContactActionsComponent implements OnInit {
    @Input() contact: Contact;
    @Output() update: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private dialog: MatDialog,
        private raidenService: RaidenService,
        private addressBookService: AddressBookService,
        private selectedTokenService: SelectedTokenService
    ) {}

    ngOnInit() {}

    pay() {
        this.selectedTokenService.selectedToken$
            .pipe(
                first(),
                flatMap(token => {
                    const payload: PaymentDialogPayload = {
                        tokenAddress: !!token ? token.address : '',
                        targetAddress: this.contact.address,
                        amount: new BigNumber(0)
                    };

                    const dialog = this.dialog.open(PaymentDialogComponent, {
                        data: payload,
                        width: '360px'
                    });

                    return dialog.afterClosed();
                }),
                flatMap((result?: PaymentDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.initiatePayment(
                        result.tokenAddress,
                        result.targetAddress,
                        result.amount
                    );
                })
            )
            .subscribe(() => {
                this.channelPollingService.refresh();
                this.pendingTransferPollingService.refresh();
            });
    }

    delete() {
        const contact = this.contact;
        const payload: ConfirmationDialogPayload = {
            title: 'Delete contact',
            message: `Are you sure you want to delete the entry <strong>${
                contact.label
            }</strong> for address <strong>${contact.address}</strong>?`
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload,
            width: '360px'
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap(result => {
                    if (!result) {
                        return EMPTY;
                    }
                    return of(result);
                })
            )
            .subscribe(result => {
                if (result) {
                    this.addressBookService.delete(contact);
                    this.update.emit(true);
                }
            });
    }
}
