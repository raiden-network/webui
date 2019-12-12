import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { EMPTY, Subscription } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { flatMap } from 'rxjs/operators';
import { Channel } from '../../models/channel';
import { SortingData } from '../../models/sorting.data';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { amountToDecimal } from '../../utils/amount.converter';
import { StringUtils } from '../../utils/string.utils';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload
} from '../confirmation-dialog/confirmation-dialog.component';
import {
    DepositWithdrawDialogComponent,
    DepositWithdrawDialogPayload,
    DepositWithdrawDialogResult
} from '../deposit-withdraw-dialog/deposit-withdraw-dialog.component';
import {
    OpenDialogComponent,
    OpenDialogPayload,
    OpenDialogResult
} from '../open-dialog/open-dialog.component';
import {
    PaymentDialogComponent,
    PaymentDialogPayload
} from '../payment-dialog/payment-dialog.component';
import { ChannelSorting } from './channel.sorting.enum';
import { AddressBookService } from '../../services/address-book.service';
import { Addresses } from '../../models/address';
import { PageBaseComponent } from '../page/page-base/page-base.component';
import { DepositMode } from '../../utils/helpers';
import BigNumber from 'bignumber.js';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-channel-table',
    templateUrl: './channel-table.component.html',
    styleUrls: ['./channel-table.component.scss'],
    animations: Animations.flyInOut
})
export class ChannelTableComponent implements OnInit, OnDestroy {
    @ViewChild(PageBaseComponent, { static: true })
    page: PageBaseComponent;

    public channels$: Observable<Channel[]>;

    visibleChannels: Channel[] = [];
    totalChannels = 0;

    pageSize = 10;
    sorting = ChannelSorting.Balance;
    filter = '';
    ascending = false;

    sortingOptions: SortingData[] = [
        {
            value: ChannelSorting.Channel,
            label: 'Channel'
        },
        {
            value: ChannelSorting.Partner,
            label: 'Partner'
        },
        {
            value: ChannelSorting.Token,
            label: 'Token'
        },
        {
            value: ChannelSorting.Balance,
            label: 'Balance'
        },
        {
            value: ChannelSorting.State,
            label: 'State'
        }
    ];

    refreshing$ = this.channelPollingService.refreshing();

    private currentPage = 0;
    private channels: Channel[];
    private subscription: Subscription;
    private _addresses: Addresses;

    constructor(
        public dialog: MatDialog,
        private raidenConfig: RaidenConfig,
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private identiconCacheService: IdenticonCacheService,
        private addressBookService: AddressBookService,
        private pendingTransferPollingService: PendingTransferPollingService
    ) {}

    ngOnInit() {
        this.channels$ = this.channelPollingService.channels();
        this.subscription = this.channels$.subscribe((channels: Channel[]) => {
            this.channels = channels;
            this.totalChannels = channels.length;
            this.applyFilters();
        });

        this.refresh();
        this._addresses = this.addressBookService.get();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    onPageEvent(event: PageEvent) {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.applyFilters();
    }

    changeOrder() {
        this.ascending = !this.ascending;
        this.applyFilters();
    }

    applyKeywordFilter() {
        this.applyFilters();
        this.page.firstPage();
    }

    clearFilter() {
        this.filter = '';
        this.applyFilters();
        this.page.firstPage();
    }

    // noinspection JSMethodCanBeStatic
    trackByFn(index, item: Channel) {
        return item.channel_identifier.toNumber();
    }

    // noinspection JSMethodCanBeStatic
    identicon(channel: Channel): string {
        return this.identiconCacheService.getIdenticon(channel.partner_address);
    }

    addressLabel(address: string): string | undefined {
        return this._addresses[address];
    }

    public onPay(channel: Channel = null) {
        const payload: PaymentDialogPayload = {
            tokenAddress: channel ? channel.token_address : '',
            targetAddress: channel ? channel.partner_address : '',
            amount: new BigNumber(0),
            decimals: channel ? channel.userToken.decimals : 0,
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
                this.refresh();
                this.pendingTransferPollingService.refresh();
            });
    }

    public onDepositDialog(channel: Channel, depositMode: DepositMode) {
        const payload: DepositWithdrawDialogPayload = {
            decimals: channel.userToken.decimals,
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
                        channel.token_address,
                        channel.partner_address,
                        deposit.tokenAmount,
                        depositMode
                    );
                })
            )
            .subscribe(() => this.refresh());
    }

    public onClose(channel: Channel) {
        const payload: ConfirmationDialogPayload = {
            title: 'Close Channel',
            message: `Are you sure you want to close channel ${
                channel.channel_identifier
            } with <strong>${channel.partner_address}</strong> on <strong>${
                channel.userToken.name
            }<strong/> (${channel.userToken.address})?`
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
                        channel.token_address,
                        channel.partner_address
                    );
                })
            )
            .subscribe(() => this.refresh());
    }

    public onOpenChannel() {
        const rdnConfig = this.raidenConfig.config;

        const payload: OpenDialogPayload = {
            ownAddress: this.raidenService.raidenAddress,
            revealTimeout: rdnConfig.reveal_timeout,
            defaultSettleTimeout: rdnConfig.settle_timeout
        };

        const dialog = this.dialog.open(OpenDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((result: OpenDialogResult) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.openChannel(
                        result.tokenAddress,
                        result.partnerAddress,
                        result.settleTimeout,
                        result.balance
                    );
                })
            )
            .subscribe(() => this.refresh());
    }

    changeSorting(sorting: ChannelSorting) {
        this.sorting = sorting;
        this.applyFilters();
    }

    applyFilters() {
        const channels: Array<Channel> = this.channels;
        let compareFn: (a: Channel, b: Channel) => number;

        const compareBigNumbers: (
            ascending: boolean,
            a: BigNumber,
            b: BigNumber
        ) => number = (ascending, a, b) => {
            return ascending ? a.minus(b).toNumber() : b.minus(a).toNumber();
        };

        switch (this.sorting) {
            case ChannelSorting.State:
                compareFn = (a, b) =>
                    StringUtils.compare(this.ascending, a.state, b.state);
                break;
            case ChannelSorting.Token:
                compareFn = (a, b) =>
                    StringUtils.compare(
                        this.ascending,
                        a.token_address,
                        b.token_address
                    );
                break;
            case ChannelSorting.Partner:
                compareFn = (a, b) =>
                    StringUtils.compare(
                        this.ascending,
                        a.partner_address,
                        b.partner_address
                    );
                break;
            case ChannelSorting.Channel:
                compareFn = (a, b) =>
                    compareBigNumbers(
                        this.ascending,
                        a.channel_identifier,
                        b.channel_identifier
                    );
                break;
            default:
                compareFn = (a, b) => {
                    const aBalance = amountToDecimal(
                        a.balance,
                        a.userToken.decimals
                    );
                    const bBalance = amountToDecimal(
                        b.balance,
                        b.userToken.decimals
                    );
                    return compareBigNumbers(
                        this.ascending,
                        aBalance,
                        bBalance
                    );
                };
                break;
        }

        const start = this.pageSize * this.currentPage;

        const filteredChannels = channels.filter((value: Channel) =>
            this.searchFilter(value)
        );

        this.totalChannels = this.filter
            ? filteredChannels.length
            : this.channels.length;

        this.visibleChannels = filteredChannels
            .sort(compareFn)
            .slice(start, start + this.pageSize);
    }

    private refresh() {
        this.channelPollingService.refresh();
    }

    private searchFilter(channel: Channel): boolean {
        const searchString = this.filter.toLocaleLowerCase();
        const identifier = channel.channel_identifier.toFixed();
        const partner = channel.partner_address.toLocaleLowerCase();
        const tokenAddress = channel.token_address.toLocaleLowerCase();
        const channelState = channel.state.toLocaleLowerCase();
        const tokenName = channel.userToken.name.toLocaleLowerCase();
        const tokenSymbol = channel.userToken.symbol.toLocaleLowerCase();

        return (
            identifier.startsWith(searchString) ||
            partner.startsWith(searchString) ||
            tokenAddress.startsWith(searchString) ||
            channelState.startsWith(searchString) ||
            tokenName.startsWith(searchString) ||
            tokenSymbol.startsWith(searchString)
        );
    }
}
