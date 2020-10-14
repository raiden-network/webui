import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { amountFromDecimal } from '../../utils/amount.converter';
import BigNumber from 'bignumber.js';
import { TokenPollingService } from '../../services/token-polling.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { mergeMap, takeUntil, map } from 'rxjs/operators';
import { EMPTY, Subject, Observable } from 'rxjs';
import {
    PaymentDialogPayload,
    PaymentDialogComponent,
} from '../payment-dialog/payment-dialog.component';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent,
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { SelectedTokenService } from '../../services/selected-token.service';
import { PaymentHistoryPollingService } from '../../services/payment-history-polling.service';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html',
    styleUrls: ['./token.component.scss'],
})
export class TokenComponent implements OnInit, OnDestroy {
    tokens$: Observable<UserToken[]>;
    selectedToken: UserToken;
    totalChannels = 0;
    onMainnet: boolean;

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private tokenPollingService: TokenPollingService,
        private dialog: MatDialog,
        private pendingTransferPollingService: PendingTransferPollingService,
        private channelPollingService: ChannelPollingService,
        private selectedTokenService: SelectedTokenService,
        private paymentHistoryPollingService: PaymentHistoryPollingService
    ) {
        this.tokens$ = this.tokenPollingService.tokens$;
    }

    get production(): boolean {
        return this.raidenService.production;
    }

    ngOnInit() {
        this.channelPollingService.channels$
            .pipe(
                map((channels) =>
                    channels.filter((channel) => channel.state !== 'settled')
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((channels) => {
                this.totalChannels = channels.length;
            });

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token) => {
                this.selectedToken = token;
            });

        this.raidenService.network$.subscribe((network) => {
            this.onMainnet = network.chainId === 1;
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    get isAllNetworksView(): boolean {
        return !this.selectedToken;
    }

    get openChannels(): number {
        if (this.isAllNetworksView) {
            return this.totalChannels;
        } else {
            return this.selectedToken.connected
                ? this.selectedToken.connected.channels
                : 0;
        }
    }

    trackByFn(index, item: UserToken) {
        return item?.address ?? '0';
    }

    quickConnectPending(tokenAddress: string): boolean {
        return !!this.raidenService.quickConnectPending[tokenAddress];
    }

    pay() {
        if (this.openChannels === 0) {
            this.askForQuickConnect();
            return;
        }

        const payload: PaymentDialogPayload = {
            tokenAddress: this.selectedToken?.address ?? '',
            targetAddress: '',
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

    mint() {
        const decimals = this.selectedToken.decimals;
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
            .mintToken(
                this.selectedToken,
                this.raidenService.raidenAddress,
                amount
            )
            .subscribe(() => this.tokenPollingService.refresh());
    }

    leaveNetwork() {
        const token = this.selectedToken;
        const payload: ConfirmationDialogPayload = {
            title: 'Leave Token Network',
            message: `Are you sure you want to close and settle all ${token.symbol} channels in ${token.name} network?`,
        };
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                mergeMap((result) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.leaveTokenNetwork(token);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
                this.channelPollingService.refresh();
            });
    }

    private askForQuickConnect() {
        const tokenSymbol = this.selectedToken?.symbol ?? '';
        const payload: ConfirmationDialogPayload = {
            title: `No open ${tokenSymbol} channels`,
            message: `Do you want to use quick connect to automatically open ${tokenSymbol} channels?`,
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog.afterClosed().subscribe((result) => {
            if (result) {
                this.openConnectionManager();
            }
        });
    }

    private openConnectionManager() {
        const payload: ConnectionManagerDialogPayload = {
            token: this.selectedToken,
            funds: undefined,
        };

        const dialog = this.dialog.open(ConnectionManagerDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                mergeMap((result: ConnectionManagerDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }
                    this.selectedTokenService.setToken(result.token);

                    return this.raidenService.connectTokenNetwork(
                        result.funds,
                        result.token.address
                    );
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
                this.channelPollingService.refresh();
            });
    }
}
