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
        private tokenPollingService: TokenPollingService
    ) {}

    ngOnInit() {}

    deposit() {
        this.openDeposit(DepositMode.DEPOSIT);
    }

    withdraw() {
        this.openDeposit(DepositMode.WITHDRAW);
    }

    close() {
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
            decimals: this.channel.userToken.decimals,
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
