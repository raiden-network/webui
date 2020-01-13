import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef
} from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';
import { Subscription } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenUtils } from '../../utils/token.utils';
import { Animations } from '../../animations/animations';

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
    currentSelection = 0;
    selectables = 0;
    totalChannels = 0;

    @ViewChild('tokens', { static: true }) private carousel: ElementRef;
    private tokens: UserToken[] = [];
    private subscription: Subscription;

    constructor(
        private tokenPollingService: TokenPollingService,
        private channelPollingService: ChannelPollingService
    ) {}

    ngOnInit() {
        this.subscription = this.tokenPollingService.tokens$.subscribe(
            (tokens: UserToken[]) => {
                this.tokens = tokens;
                this.selectables = tokens.length + 1;
                this.applySelection();
            }
        );

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
        if (this.currentSelection === this.selectables - 1) {
            return;
        }
        this.currentSelection++;
        this.applySelection();
    }

    previousToken() {
        if (this.currentSelection === 0) {
            return;
        }
        this.currentSelection--;
        this.applySelection();
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

    select(index: number) {
        this.currentSelection = index;
        this.applySelection();
    }

    private applySelection() {
        this.tokens.sort((a, b) => TokenUtils.compareTokens(a, b));

        this.visibleItems = [{ allNetworksView: true }, ...this.tokens].slice(
            this.currentSelection,
            this.currentSelection + 3
        );
    }
}
