import { Component, OnInit, OnDestroy } from '@angular/core';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY, Subscription } from 'rxjs';
import { RaidenService } from '../../services/raiden.service';
import { UserToken } from '../../models/usertoken';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { TokenPollingService } from '../../services/token-polling.service';
import { SelectedTokenService } from '../../services/selected-token.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    selectedToken: UserToken;

    private subscription: Subscription;

    constructor(
        private dialog: MatDialog,
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private tokenPollingService: TokenPollingService,
        private selectedTokenService: SelectedTokenService
    ) {}

    ngOnInit() {
        this.subscription = this.selectedTokenService.selectedToken$.subscribe(
            (token: UserToken) => {
                this.selectedToken = token;
            }
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    pay() {
        const payload: PaymentDialogPayload = {
            tokenAddress: !!this.selectedToken
                ? this.selectedToken.address
                : '',
            targetAddress: '',
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

    openConnectionManager(join: boolean = true) {
        const payload: ConnectionManagerDialogPayload = {
            tokenAddress: this.selectedToken.address,
            funds: new BigNumber(0),
            decimals: this.selectedToken.decimals,
            join: join
        };

        const joinDialogRef = this.dialog.open(
            ConnectionManagerDialogComponent,
            {
                data: payload
            }
        );

        joinDialogRef
            .afterClosed()
            .pipe(
                flatMap((result: ConnectionManagerDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }
                    return this.raidenService.connectTokenNetwork(
                        result.funds,
                        result.tokenAddress,
                        result.join
                    );
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
                this.channelPollingService.refresh();
            });
    }
}
