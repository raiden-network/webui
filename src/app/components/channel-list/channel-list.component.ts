import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewInit,
    HostListener,
} from '@angular/core';
import { Channel } from '../../models/channel';
import { Subscription, EMPTY, Subject } from 'rxjs';
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
import { flatMap, map, takeUntil } from 'rxjs/operators';
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
    @ViewChild('channel_list', { static: true })
    private listElement: ElementRef;

    visibleChannels: Channel[] = [];
    totalChannels = 0;
    numberOfFilteredChannels = 0;
    showAll = false;
    itemsPerRow = 0;

    private channels: Channel[] = [];
    private searchFilter = '';
    private selectedToken: UserToken;
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
                    channels.filter(
                        (channel) =>
                            channel.state === 'opened' ||
                            channel.state === 'waiting_for_open'
                    )
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((channels: Channel[]) => {
                this.channels = channels;
                this.totalChannels = channels.length;
                this.updateVisibleChannels();
            });

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token: UserToken) => {
                this.selectedToken = token;
                this.showAll = false;
                this.updateVisibleChannels();
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((value) => {
                this.searchFilter = value;
                this.updateVisibleChannels();
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    ngAfterViewInit() {
        this.calculateItemsPerRow();
        this.updateVisibleChannels();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.calculateItemsPerRow();
        this.updateVisibleChannels();
    }

    trackByFn(index, item: Channel) {
        return `${item.token_address}_${item.partner_address}`;
    }

    toggleShowAll() {
        this.showAll = !this.showAll;
        this.updateVisibleChannels();
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
        this.numberOfFilteredChannels = filteredChannels.length;

        filteredChannels.sort((a, b) => {
            const aBalance = amountToDecimal(a.balance, a.userToken.decimals);
            const bBalance = amountToDecimal(b.balance, b.userToken.decimals);

            return bBalance.minus(aBalance).toNumber();
        });

        if (this.showAll) {
            this.visibleChannels = filteredChannels;
        } else {
            this.visibleChannels = filteredChannels.slice(0, this.itemsPerRow);
        }
    }

    private calculateItemsPerRow() {
        const listWidth = this.listElement.nativeElement.getBoundingClientRect()
            .width;
        this.itemsPerRow = Math.floor((listWidth - 213) / 229);
    }
}
