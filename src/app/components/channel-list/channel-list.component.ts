import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewInit,
} from '@angular/core';
import { Channel } from '../../models/channel';
import { EMPTY, Subject, Observable, fromEvent } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { amountToDecimal } from '../../utils/amount.converter';
import { UserToken } from '../../models/usertoken';
import {
    OpenDialogPayload,
    OpenDialogResult,
    OpenDialogComponent,
} from '../open-dialog/open-dialog.component';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { flatMap, map, takeUntil, debounceTime } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Animations } from '../../animations/animations';
import { TokenPollingService } from '../../services/token-polling.service';
import { SelectedTokenService } from '../../services/selected-token.service';
import { SharedService } from '../../services/shared.service';
import { matchesChannel, matchesContact } from '../../shared/keyword-matcher';
import { AddressBookService } from '../../services/address-book.service';
import { Contact } from '../../models/contact';

@Component({
    selector: 'app-channel-list',
    templateUrl: './channel-list.component.html',
    styleUrls: ['./channel-list.component.css'],
    animations: Animations.stretchInOut,
})
export class ChannelListComponent implements OnInit, OnDestroy, AfterViewInit {
    private static MIN_CHANNEL_WIDTH = 183;

    @ViewChild('channel_list', { static: true })
    private channelsElement: ElementRef;

    visibleChannels: Channel[] = [];
    itemsPerRow = 0;
    channelWidth = 0;
    selectedToken: UserToken;

    private channels: Channel[] = [];
    private searchFilter = '';
    private ngUnsubscribe = new Subject();

    constructor(
        private channelPollingService: ChannelPollingService,
        private raidenConfig: RaidenConfig,
        private raidenService: RaidenService,
        private dialog: MatDialog,
        private tokenPollingService: TokenPollingService,
        private selectedTokenService: SelectedTokenService,
        private sharedService: SharedService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit() {
        this.channelPollingService.channels$
            .pipe(
                map((channels) =>
                    channels.filter((channel) => channel.state !== 'settled')
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((channels: Channel[]) => {
                this.channels = channels;
                this.updateVisibleChannels();
            });

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token: UserToken) => {
                this.selectedToken = token;
                this.updateVisibleChannels();
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchFilter = value;
                this.updateVisibleChannels();
            });

        fromEvent(window, 'resize')
            .pipe(debounceTime(300), takeUntil(this.ngUnsubscribe))
            .subscribe(() => {
                this.calculateItemsPerRow();
            });
    }

    ngAfterViewInit() {
        setTimeout(() => this.calculateItemsPerRow());
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    rowTrackByFn(index, item: Channel[]): string {
        return item.reduce(
            (accumulator, current) =>
                accumulator +
                `_${current.token_address}-${current.partner_address}`,
            ''
        );
    }

    trackByFn(index, item: Channel) {
        return `${item.token_address}_${item.partner_address}`;
    }

    openChannel() {
        const rdnConfig = this.raidenConfig.config;

        const payload: OpenDialogPayload = {
            tokenAddress: this.selectedToken ? this.selectedToken.address : '',
            revealTimeout: rdnConfig.reveal_timeout,
            defaultSettleTimeout: rdnConfig.settle_timeout,
        };

        const dialog = this.dialog.open(OpenDialogComponent, {
            data: payload,
            width: '360px',
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
            .subscribe(() => {
                this.channelPollingService.refresh();
                this.tokenPollingService.refresh();
            });
    }

    private getFilteredChannels(): Channel[] {
        return this.channels.filter((channel) => {
            let matchesToken = true;
            if (this.selectedToken) {
                matchesToken =
                    channel.token_address === this.selectedToken.address;
            }

            let contactMatchesSearchFilter = false;
            const partnerLabel = this.addressBookService.get()[
                channel.partner_address
            ];
            if (partnerLabel) {
                const contact: Contact = {
                    address: channel.partner_address,
                    label: partnerLabel,
                };
                contactMatchesSearchFilter = matchesContact(
                    this.searchFilter,
                    contact
                );
            }
            const matchesSearchFilter =
                matchesChannel(this.searchFilter, channel) ||
                contactMatchesSearchFilter;

            return matchesToken && matchesSearchFilter;
        });
    }

    private updateVisibleChannels() {
        const filteredChannels = this.getFilteredChannels();

        filteredChannels.sort((a, b) => {
            const aOpened =
                a.state === 'opened' || a.state === 'waiting_for_open';
            const bOpened =
                b.state === 'opened' || b.state === 'waiting_for_open';
            if (aOpened === bOpened) {
                const aBalance = amountToDecimal(
                    a.balance,
                    a.userToken.decimals
                );
                const bBalance = amountToDecimal(
                    b.balance,
                    b.userToken.decimals
                );
                return bBalance.minus(aBalance).toNumber();
            } else {
                return aOpened ? -1 : 1;
            }
        });

        this.visibleChannels = filteredChannels;
    }

    private calculateItemsPerRow() {
        const sectionWidth = this.channelsElement.nativeElement.getBoundingClientRect()
            .width;
        this.itemsPerRow = Math.max(
            1,
            Math.floor(sectionWidth / ChannelListComponent.MIN_CHANNEL_WIDTH)
        );
        this.channelWidth =
            (sectionWidth - 37 * (this.itemsPerRow - 1)) / this.itemsPerRow;
    }
}
