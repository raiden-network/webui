import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel } from '../../../models/channel';
import { DepositMode } from '../../../utils/helpers';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { RaidenService } from '../../../services/raiden.service';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { ChannelPollingService } from '../../../services/channel-polling.service';
import {
    DepositWithdrawDialogResult,
    DepositWithdrawDialogComponent,
    DepositWithdrawDialogPayload
} from '../../deposit-withdraw-dialog/deposit-withdraw-dialog.component';

@Component({
    selector: 'app-channel-actions',
    templateUrl: './channel-actions.component.html',
    styleUrls: ['./channel-actions.component.css']
})
export class ChannelActionsComponent implements OnInit {
    @Input() channel: Channel;

    constructor(
        private raidenService: RaidenService,
        private dialog: MatDialog,
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService
    ) {}

    ngOnInit() {}

    deposit() {
        this.onDepositDialog(DepositMode.DEPOSIT);
    }

    withdraw() {
        this.onDepositDialog(DepositMode.WITHDRAW);
    }

    onPay() {
        const payload: PaymentDialogPayload = {
            tokenAddress: this.channel.token_address,
            targetAddress: this.channel.partner_address,
            amount: new BigNumber(0),
            paymentIdentifier: null
        };

        const dialog = this.dialog.open(PaymentDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((result?: PaymentDialogPayload) => {
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
            });
    }

    onClose() {
        const payload: ConfirmationDialogPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close channel ${
                this.channel.channel_identifier
            } with <strong>${
                this.channel.partner_address
            }</strong> on <strong>${this.channel.userToken.name}<strong/> (${
                this.channel.userToken.address
            })?`
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap(result => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.closeChannel(
                        this.channel.token_address,
                        this.channel.partner_address
                    );
                })
            )
            .subscribe(() => this.channelPollingService.refresh());
    }

    private onDepositDialog(depositMode: DepositMode) {
        const payload: DepositWithdrawDialogPayload = {
            decimals: this.channel.userToken.decimals,
            depositMode: depositMode
        };

        const dialog = this.dialog.open(DepositWithdrawDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((deposit?: DepositWithdrawDialogResult) => {
                    if (!deposit) {
                        return EMPTY;
                    }

                    return this.raidenService.modifyDeposit(
                        this.channel.token_address,
                        this.channel.partner_address,
                        deposit.tokenAmount,
                        depositMode
                    );
                })
            )
            .subscribe(() => this.channelPollingService.refresh());
    }
}
