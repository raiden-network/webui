import { Component, OnInit, OnDestroy } from '@angular/core';
import { Animations } from '../../animations/animations';
import { RaidenService } from '../../services/raiden.service';
import { map } from 'rxjs/operators';
import { Observable, Subscription, zip } from 'rxjs';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { Channel } from '../../models/channel';
import { UserToken } from '../../models/usertoken';
import { NotificationService } from '../../services/notification.service';
import { Network } from '../../utils/network-info';
import { MatDialog } from '@angular/material/dialog';
import { QrCodeComponent, QrCodePayload } from '../qr-code/qr-code.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    animations: Animations.easeInOut
})
export class HeaderComponent implements OnInit, OnDestroy {
    raidenAddress: string;
    openChannels = 0;
    joinedNetworks = 0;
    readonly network$: Observable<Network>;
    readonly balance$: Observable<string>;
    readonly faucetLink$: Observable<string>;
    showAddress = false;

    private subscription: Subscription;

    constructor(
        private raidenService: RaidenService,
        private tokenPollingService: TokenPollingService,
        private channelPollingService: ChannelPollingService,
        private notificationService: NotificationService,
        private dialog: MatDialog
    ) {
        this.network$ = raidenService.network$;
        this.balance$ = raidenService.balance$;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
    }

    ngOnInit() {
        this.subscription = this.raidenService.raidenAddress$.subscribe(
            address => (this.raidenAddress = address)
        );

        const channelsSubscription = this.channelPollingService
            .channels()
            .subscribe((channels: Channel[]) => {
                const openChannels = channels.filter(channel => {
                    return channel.state === 'opened';
                });
                this.openChannels = openChannels.length;
            });
        this.subscription.add(channelsSubscription);

        const tokensSubscription = this.tokenPollingService.tokens$.subscribe(
            (tokens: UserToken[]) => {
                const connectedTokens = tokens.filter(
                    (token: UserToken) => !!token.connected
                );
                this.joinedNetworks = connectedTokens.length;
            }
        );
        this.subscription.add(tokensSubscription);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    toggleNotificationSidenav() {
        this.notificationService.toggleSidenav();
    }

    showOwnAddressQrCode() {
        const payload: QrCodePayload = {
            content: this.raidenAddress
        };
        this.dialog.open(QrCodeComponent, {
            data: payload,
            width: '360px'
        });
    }
}
