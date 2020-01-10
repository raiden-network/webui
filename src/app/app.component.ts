import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { Observable, Subscription, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { MediaObserver } from '@angular/flex-layout';
import { Network } from './utils/network-info';
import { NotificationService } from './services/notification.service';
import { TokenPollingService } from './services/token-polling.service';
import { Channel } from './models/channel';
import { UserToken } from './models/usertoken';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Animations } from './animations/animations';

const icon_names = [
    'copy',
    'qr',
    'notification',
    'search',
    'token',
    'channel',
    'go',
    'left',
    'right'
];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: Animations.easeInOut
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled')
    public animationsDisabled = false;
    @ViewChild('menu_sidenav', { static: true })
    public menuSidenav: MatSidenav;

    public raidenAddress: string;
    public totalChannels = 0;
    public joinedNetworks = 0;
    public readonly balance$: Observable<string>;
    public readonly network$: Observable<Network>;
    public readonly faucetLink$: Observable<string>;
    public showAddress = false;
    public showNetworkInfo = false;

    private subscription: Subscription;

    constructor(
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private mediaObserver: MediaObserver,
        private notificationService: NotificationService,
        private tokenPollingService: TokenPollingService,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer
    ) {
        this.balance$ = raidenService.balance$;
        this.network$ = raidenService.network$;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );

        this.registerIcons();
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }

    isSmallScreen(): boolean {
        return this.mediaObserver.isActive('lt-md');
    }

    ngOnInit() {
        this.subscription = this.raidenService.raidenAddress$.subscribe(
            address => (this.raidenAddress = address)
        );

        const channelsSubscription = this.channelPollingService
            .channels()
            .subscribe((channels: Channel[]) => {
                this.totalChannels = channels.length;
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

        const networkSubscription = this.network$.subscribe(network => {
            if (network.chainId !== 1) {
                this.showNetworkInfo = true;
                setTimeout(() => {
                    this.hideNetworkInfo();
                }, 5000);
            }
        });
        this.subscription.add(networkSubscription);

        this.disableAnimationsOnAndroid();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    hasError(): boolean {
        return (
            this.notificationService.rpcError !== null ||
            this.notificationService.apiError !== null
        );
    }

    hasApiError(): boolean {
        return this.notificationService.apiError !== null;
    }

    getRpcErrorTrace(): string {
        if (this.notificationService.rpcError === null) {
            return null;
        }
        return this.notificationService.rpcError.stack;
    }

    getApiErrorMessage(): string {
        if (this.notificationService.apiError === null) {
            return null;
        }
        return this.notificationService.apiError.message;
    }

    attemptRpcConnection() {
        this.raidenService.attemptRpcConnection();
    }

    attemptApiConnection() {
        this.raidenService.attemptApiConnection();
    }

    toggleMenu() {
        this.menuSidenav.toggle();
    }

    closeMenu() {
        if (this.isMobile()) {
            this.menuSidenav.close();
        }
    }

    hideNetworkInfo() {
        this.showNetworkInfo = false;
    }

    private disableAnimationsOnAndroid() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.indexOf('android') > -1;
        if (isAndroid) {
            this.animationsDisabled = true;
        }
    }

    private registerIcons() {
        icon_names.forEach(icon => {
            this.matIconRegistry.addSvgIcon(
                icon,
                this.domSanitizer.bypassSecurityTrustResourceUrl(
                    `assets/icons/${icon}.svg`
                )
            );
        });
    }
}
