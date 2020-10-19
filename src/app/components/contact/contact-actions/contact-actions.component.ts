import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    OnDestroy,
} from '@angular/core';
import { Contact } from '../../../models/contact';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { ChannelPollingService } from '../../../services/channel-polling.service';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import {
    PaymentDialogPayload,
    PaymentDialogComponent,
} from '../../payment-dialog/payment-dialog.component';
import { EMPTY, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RaidenService } from '../../../services/raiden.service';
import { AddressBookService } from '../../../services/address-book.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from '../../confirmation-dialog/confirmation-dialog.component';
import { SelectedTokenService } from '../../../services/selected-token.service';
import {
    AddEditContactDialogComponent,
    AddEditContactDialogPayload,
} from '../../add-edit-contact-dialog/add-edit-contact-dialog.component';
import { UserToken } from '../../../models/usertoken';
import { PaymentHistoryPollingService } from '../../../services/payment-history-polling.service';
import { TokenPollingService } from '../../../services/token-polling.service';

@Component({
    selector: 'app-contact-actions',
    templateUrl: './contact-actions.component.html',
    styleUrls: ['./contact-actions.component.scss'],
})
export class ContactActionsComponent implements OnInit, OnDestroy {
    @Input() contact: Contact;
    @Output() actionClicked: EventEmitter<boolean> = new EventEmitter();

    selectedToken: UserToken;
    hasAnyConnection = false;

    private ngUnsubscribe = new Subject();

    constructor(
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private dialog: MatDialog,
        private raidenService: RaidenService,
        private addressBookService: AddressBookService,
        private selectedTokenService: SelectedTokenService,
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private tokenPollingService: TokenPollingService
    ) {}

    ngOnInit() {
        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token: UserToken) => {
                this.selectedToken = token;
            });

        this.channelPollingService.channels$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((channels) => {
                const openChannels = channels.filter(
                    (channel) => channel.state === 'opened'
                );
                this.hasAnyConnection = openChannels.length > 0;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    isConnected(): boolean {
        if (!this.selectedToken) {
            return this.hasAnyConnection;
        }
        return !!this.selectedToken.connected;
    }

    getTokenSymbol(): string {
        return this.selectedToken ? this.selectedToken.symbol : '';
    }

    pay() {
        this.actionClicked.emit(true);

        const payload: PaymentDialogPayload = {
            tokenAddress: this.selectedToken ? this.selectedToken.address : '',
            targetAddress: this.contact.address,
            amount: undefined,
        };

        const dialog = this.dialog.open(PaymentDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                mergeMap((result?: PaymentDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.initiatePayment(
                        result.tokenAddress,
                        result.targetAddress,
                        result.amount,
                        result.paymentIdentifier
                    );
                })
            )
            .subscribe(() => {
                this.channelPollingService.refresh();
                this.pendingTransferPollingService.refresh();
                this.paymentHistoryPollingService.refresh();
                this.tokenPollingService.refresh();
            });
    }

    edit() {
        this.actionClicked.emit(true);

        const payload: AddEditContactDialogPayload = {
            address: this.contact.address,
            label: this.contact.label,
            edit: true,
        };

        const dialog = this.dialog.open(AddEditContactDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog.afterClosed().subscribe((result?: Contact) => {
            if (result) {
                this.addressBookService.save(result);
            }
        });
    }

    delete() {
        this.actionClicked.emit(true);

        const contact = this.contact;
        const payload: ConfirmationDialogPayload = {
            title: 'Delete Contact',
            message: `Are you sure you want to delete the contact ${contact.label} for address ${contact.address}?`,
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog.afterClosed().subscribe((result) => {
            if (result) {
                this.addressBookService.delete(contact);
            }
        });
    }
}
