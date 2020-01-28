import { Component, Input, OnInit } from '@angular/core';
import { Channel } from '../../../models/channel';
import { DepositMode } from '../../../utils/helpers';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { RaidenService } from '../../../services/raiden.service';
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
import { TokenPollingService } from '../../../services/token-polling.service';
import { AddressBookService } from '../../../services/address-book.service';

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
        private tokenPollingService: TokenPollingService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit() {}

    deposit() {
        this.openDeposit(DepositMode.DEPOSIT);
    }

    withdraw() {
        this.openDeposit(DepositMode.WITHDRAW);
    }

    close() {
        const partner = this.addressBookService.get()[
            this.channel.partner_address
        ];

        const payload: ConfirmationDialogPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close the ${
                this.channel.userToken.symbol
            } channel with ${partner ? partner + ' ' : ''}${
                this.channel.partner_address
            } in ${this.channel.userToken.name} network?`
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

                    return this.raidenService.closeChannel(
                        this.channel.token_address,
                        this.channel.partner_address
                    );
                })
            )
            .subscribe(() => {
                this.channelPollingService.refresh();
                this.tokenPollingService.refresh();
            });
    }

    private openDeposit(depositMode: DepositMode) {
        const payload: DepositWithdrawDialogPayload = {
            token: this.channel.userToken,
            depositMode: depositMode
        };

        const dialog = this.dialog.open(DepositWithdrawDialogComponent, {
            data: payload,
            width: '360px'
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
