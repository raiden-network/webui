import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { amountFromDecimal } from '../../utils/amount.converter';
import BigNumber from 'bignumber.js';
import { TokenPollingService } from '../../services/token-polling.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../payment-dialog/payment-dialog.component';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html',
    styleUrls: ['./token.component.css']
})
export class TokenComponent implements OnInit {
    @Input() token: UserToken;
    @Input() openChannels: number;
    @Input() selected = false;
    @Input() allNetworksView = false;
    @Input() onMainnet = true;
    @Output() select: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private raidenService: RaidenService,
        private tokenPollingService: TokenPollingService,
        private dialog: MatDialog,
        private pendingTransferPollingService: PendingTransferPollingService,
        private channelPollingService: ChannelPollingService
    ) {}

    ngOnInit() {}

    getTokenSymbol(): string {
        return this.allNetworksView ? '' : this.token.symbol;
    }

    pay() {
        const payload: PaymentDialogPayload = {
            tokenAddress: this.allNetworksView ? '' : this.token.address,
            targetAddress: '',
            amount: undefined
        };

        const dialog = this.dialog.open(PaymentDialogComponent, {
            data: payload,
            width: '360px'
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
                        result.amount
                    );
                })
            )
            .subscribe(() => {
                this.channelPollingService.refresh();
                this.pendingTransferPollingService.refresh();
            });
    }

    openConnectionManager() {
        const token = this.token;
        const join = !token.connected;

        const payload: ConnectionManagerDialogPayload = {
            token: token,
            funds: undefined
        };

        const joinDialogRef = this.dialog.open(
            ConnectionManagerDialogComponent,
            {
                data: payload,
                width: '360px'
            }
        );

        joinDialogRef
            .afterClosed()
            .pipe(
                flatMap((result: ConnectionManagerDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }
                    let funds = result.funds;
                    if (!join) {
                        funds = funds.plus(token.connected.funds);
                    }

                    return this.raidenService.connectTokenNetwork(
                        funds,
                        result.token.address,
                        join
                    );
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
                this.channelPollingService.refresh();
            });
    }

    mint() {
        const decimals = this.token.decimals;
        const scaleFactor = decimals >= 18 ? 1 : decimals / 18;
        const amount = amountFromDecimal(new BigNumber(0.5), decimals)
            .times(scaleFactor)
            .plus(
                amountFromDecimal(new BigNumber(5000), decimals).times(
                    1 - scaleFactor
                )
            )
            .integerValue();
        this.raidenService
            .mintToken(this.token, this.raidenService.raidenAddress, amount)
            .subscribe(() => this.tokenPollingService.refresh());
    }

    leaveNetwork() {
        const payload: ConfirmationDialogPayload = {
            title: 'Leave Token Network',
            message: `Are you sure you want to close and settle all ${this.token.symbol} channels in ${this.token.name} network?`
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

                    return this.raidenService.leaveTokenNetwork(this.token);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
            });
    }
}
