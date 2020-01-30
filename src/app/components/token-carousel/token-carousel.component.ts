import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef
} from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';
import { Subscription, Observable, EMPTY } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenUtils } from '../../utils/token.utils';
import { SelectedTokenService } from '../../services/selected-token.service';
import { Network } from '../../utils/network-info';
import { RaidenService } from '../../services/raiden.service';
import { map, flatMap } from 'rxjs/operators';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import {
    ConnectionManagerDialogPayload,
    ConnectionManagerDialogComponent
} from '../connection-manager-dialog/connection-manager-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { AnimationBuilder, animate, style } from '@angular/animations';

interface AllNetworksView {
    allNetworksView: boolean;
}

@Component({
    selector: 'app-token-carousel',
    templateUrl: './token-carousel.component.html',
    styleUrls: ['./token-carousel.component.css']
})
export class TokenCarouselComponent implements OnInit, OnDestroy {
    @ViewChild('carousel', { static: true }) private carousel: ElementRef;

    visibleItems: Array<UserToken | AllNetworksView> = [];
    currentItem = 0;
    currentSelection: UserToken | AllNetworksView = { allNetworksView: true };
    totalChannels = 0;
    readonly network$: Observable<Network>;

    private subscription: Subscription;

    constructor(
        private tokenPollingService: TokenPollingService,
        private channelPollingService: ChannelPollingService,
        private selectedTokenService: SelectedTokenService,
        private raidenService: RaidenService,
        private dialog: MatDialog,
        private pendingTransferPollingService: PendingTransferPollingService,
        private animationBuilder: AnimationBuilder
    ) {
        this.network$ = raidenService.network$;
    }

    get production(): boolean {
        return this.raidenService.production;
    }

    ngOnInit() {
        this.subscription = this.tokenPollingService.tokens$
            .pipe(
                map(tokens =>
                    tokens.sort((a, b) => TokenUtils.compareTokens(a, b))
                )
            )
            .subscribe((tokens: UserToken[]) => {
                this.visibleItems = [{ allNetworksView: true }, ...tokens];
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

    next() {
        if (this.currentItem + 1 === this.visibleItems.length) {
            return;
        }
        this.currentItem++;
        this.playAnimation();
    }

    previous() {
        if (this.currentItem === 0) {
            return;
        }
        this.currentItem--;
        this.playAnimation();
    }

    isAllNetworksView(object: any): object is AllNetworksView {
        return 'allNetworksView' in object;
    }

    getNumberOfChannels(item: UserToken | AllNetworksView) {
        if (this.isAllNetworksView(item)) {
            return this.totalChannels;
        } else if (item.connected) {
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

    register() {
        const dialog = this.dialog.open(RegisterDialogComponent, {
            width: '360px'
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

    pay() {
        const payload: PaymentDialogPayload = {
            tokenAddress: this.isAllNetworksView(this.currentSelection)
                ? ''
                : this.currentSelection.address,
            targetAddress: '',
            amount: new BigNumber(0)
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
        if (this.isAllNetworksView(this.currentSelection)) {
            return;
        }
        const token = this.currentSelection;
        const join = !token.connected;

        const payload: ConnectionManagerDialogPayload = {
            token: this.currentSelection,
            funds: new BigNumber(0)
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

    private playAnimation() {
        const offset = this.currentItem * 320;
        const animation = this.animationBuilder.build([
            animate(
                '250ms ease-in',
                style({ transform: `translateX(-${offset}px)` })
            )
        ]);
        animation.create(this.carousel.nativeElement).play();
    }
}
