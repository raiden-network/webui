import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { Channel } from '../../models/channel';
import { Subscription, EMPTY } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { amountToDecimal } from '../../utils/amount.converter';
import { UserToken } from '../../models/usertoken';
import {
    OpenDialogPayload,
    OpenDialogResult,
    OpenDialogComponent
} from '../open-dialog/open-dialog.component';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { flatMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-channel-list',
    templateUrl: './channel-list.component.html',
    styleUrls: ['./channel-list.component.css'],
    animations: Animations.flyInOut
})
export class ChannelListComponent implements OnInit, OnDestroy, OnChanges {
    @Input() token: UserToken;

    visibleChannels: Channel[] = [];
    totalChannels = 0;
    showAll = false;
    selectedIndex = -1;

    private channels: Channel[] = [];
    private subscription: Subscription;

    constructor(
        private channelPollingService: ChannelPollingService,
        private raidenConfig: RaidenConfig,
        private raidenService: RaidenService,
        private dialog: MatDialog
    ) {}

    ngOnInit() {
        this.subscription = this.channelPollingService
            .channels()
            .subscribe((channels: Channel[]) => {
                this.channels = channels;
                this.updateVisibleChannels();
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('token' in changes) {
            this.updateVisibleChannels();
        }
    }

    trackByFn(index, item: Channel) {
        return `${item.token_address}_${item.partner_address}`;
    }

    toggleShowAll() {
        this.showAll = !this.showAll;
        this.updateVisibleChannels();
    }

    setSelectedIndex(index: number) {
        this.selectedIndex = this.selectedIndex === index ? -1 : index;
    }

    openChannel() {
        const rdnConfig = this.raidenConfig.config;

        const payload: OpenDialogPayload = {
            tokenAddress: this.token ? this.token.address : '',
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
            .subscribe();
    }

    private getFilteredChannels(): Channel[] {
        return this.channels.filter(channel => {
            let matchesToken = true;
            if (!!this.token) {
                matchesToken =
                    channel.userToken &&
                    channel.userToken.address === this.token.address;
            }
            return channel.state === 'opened' && matchesToken;
        });
    }

    private updateVisibleChannels() {
        const filteredChannels = this.getFilteredChannels();
        this.totalChannels = filteredChannels.length;

        filteredChannels.sort((a, b) => {
            const aBalance = amountToDecimal(a.balance, a.userToken.decimals);
            const bBalance = amountToDecimal(b.balance, b.userToken.decimals);

            return bBalance.minus(aBalance).toNumber();
        });

        if (this.showAll) {
            this.visibleChannels = filteredChannels;
        } else {
            this.visibleChannels = filteredChannels.slice(0, 3);
        }
    }
}
