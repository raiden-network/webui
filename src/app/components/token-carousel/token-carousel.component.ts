import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';
import { Subscription, Observable } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenUtils } from '../../utils/token.utils';
import { Animations } from '../../animations/animations';
import { SelectedTokenService } from '../../services/selected-token.service';
import { Network } from '../../utils/network-info';
import { RaidenService } from '../../services/raiden.service';
import { map } from 'rxjs/operators';

interface AllNetworksView {
    allNetworksView: boolean;
}

@Component({
    selector: 'app-token-carousel',
    templateUrl: './token-carousel.component.html',
    styleUrls: ['./token-carousel.component.css'],
    animations: Animations.easeInOut
})
export class TokenCarouselComponent implements OnInit, OnDestroy {
    visibleItems: Array<UserToken | AllNetworksView> = [];
    numberOfItems = 0;
    firstItem = 0;
    currentSelection: UserToken | AllNetworksView = { allNetworksView: true };
    totalChannels = 0;
    readonly network$: Observable<Network>;

    private tokens: UserToken[] = [];
    private subscription: Subscription;

    constructor(
        private tokenPollingService: TokenPollingService,
        private channelPollingService: ChannelPollingService,
        private selectedTokenService: SelectedTokenService,
        private raidenService: RaidenService
    ) {
        this.network$ = raidenService.network$;
    }

    ngOnInit() {
        this.subscription = this.tokenPollingService.tokens$
            .pipe(
                map(tokens =>
                    tokens.sort((a, b) => TokenUtils.compareTokens(a, b))
                )
            )
            .subscribe((tokens: UserToken[]) => {
                this.tokens = tokens;
                this.numberOfItems = this.tokens.length + 1;
                this.updateVisibleItems();
            });

        const channelsSubscription = this.channelPollingService
            .channels()
            .subscribe(channels => {
                this.totalChannels = channels.length;
            });
        this.subscription.add(channelsSubscription);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    trackByFn(index, item: UserToken | AllNetworksView) {
        return 'address' in item ? item.address : '0';
    }

    nextToken() {
        if (this.firstItem + 2 === this.numberOfItems - 1) {
            return;
        }
        this.firstItem++;
        this.updateVisibleItems();
    }

    previousToken() {
        if (this.firstItem === 0) {
            return;
        }
        this.firstItem--;
        this.updateVisibleItems();
    }

    isAllNetworksView(object: any): object is AllNetworksView {
        return 'allNetworksView' in object;
    }

    getNumberOfChannels(item: UserToken | AllNetworksView) {
        if (this.isAllNetworksView(item)) {
            return this.totalChannels;
        } else if (!!item.connected) {
            return item.connected.channels;
        } else {
            return 0;
        }
    }

    isSelected(item: UserToken | AllNetworksView) {
        if (!this.isAllNetworksView(this.currentSelection)) {
            return (
                !this.isAllNetworksView(item) &&
                this.currentSelection.address === item.address
            );
        } else {
            return this.isAllNetworksView(item);
        }
    }

    select(index: number) {
        const selection = this.visibleItems[index];
        this.currentSelection = selection;
        const selectedToken = this.isAllNetworksView(selection)
            ? undefined
            : selection;
        this.selectedTokenService.setToken(selectedToken);
    }

    private updateVisibleItems() {
        const displaybleItems = [{ allNetworksView: true }, ...this.tokens];
        this.visibleItems = displaybleItems.slice(
            this.firstItem,
            this.firstItem + 3
        );
    }
}
