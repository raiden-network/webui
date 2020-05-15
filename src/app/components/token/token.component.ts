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
import { flatMap, finalize, takeUntil, map, shareReplay } from 'rxjs/operators';
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
import { TokenUtils } from '../../utils/token.utils';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html',
    styleUrls: ['./token.component.css'],
})
export class TokenComponent implements OnInit, OnDestroy {
    tokens$: Observable<UserToken[]>;
    selectedToken: UserToken;
    totalChannels = 0;
    onMainnet: boolean;
    quickConnectPending: { [tokenAddress: string]: boolean } = {};

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private tokenPollingService: TokenPollingService,
        private dialog: MatDialog,
        private pendingTransferPollingService: PendingTransferPollingService,
        private channelPollingService: ChannelPollingService,
        private selectedTokenService: SelectedTokenService
    ) {
        this.tokens$ = this.tokenPollingService.tokens$.pipe(
            map((tokens) =>
                tokens.sort((a, b) => TokenUtils.compareTokens(a, b))
            ),
            shareReplay({ refCount: true, bufferSize: 1 })
        );
    }

    get production(): boolean {
        return this.raidenService.production;
    }

    ngOnInit() {
        this.channelPollingService.channels$
            .pipe(
                map((channels) =>
                    channels.filter(
                        (channel) =>
                            channel.state === 'opened' ||
                            channel.state === 'waiting_for_open'
                    )
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

    onSelect(item: UserToken) {
        this.selectedTokenService.setToken(item);
    }

    trackByFn(index, item: UserToken) {
        return item?.address ?? '0';
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
                flatMap((result) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.leaveTokenNetwork(token);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
            });
    }

    register() {
        const dialog = this.dialog.open(RegisterDialogComponent, {
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((tokenAddress: string) => {
                    if (!tokenAddress) {
                        return EMPTY;
                    }

                    return this.raidenService.registerToken(tokenAddress);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
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
        let tokenAddressResult: string;

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
                flatMap((result: ConnectionManagerDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }
                    tokenAddressResult = result.token.address;
                    this.quickConnectPending[tokenAddressResult] = true;

                    this.selectedTokenService.setToken(result.token);

                    return this.raidenService.connectTokenNetwork(
                        result.funds,
                        tokenAddressResult
                    );
                }),
                finalize(() => {
                    if (tokenAddressResult) {
                        this.quickConnectPending[tokenAddressResult] = false;
                    }
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
                this.channelPollingService.refresh();
            });
    }
}
