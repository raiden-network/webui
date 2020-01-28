import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    HostListener
} from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { MediaObserver } from '@angular/flex-layout';
import { NotificationService } from './services/notification.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Animations } from './animations/animations';
import { PendingTransferPollingService } from './services/pending-transfer-polling.service';
import { PaymentHistoryPollingService } from './services/payment-history-polling.service';
import { Network } from './utils/network-info';
import { UtilityService } from './services/utility.service';

const icon_names = [
    'copy',
    'qr',
    'notification',
    'search',
    'token',
    'channel',
    'go',
    'left',
    'right',
    'faucet',
    'transfer',
    'add',
    'eye',
    'thunderbolt',
    'received',
    'sent',
    'more',
    'info',
    'close'
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
    @ViewChild('notification_sidenav', { static: true })
    public notificationSidenav: MatSidenav;

    readonly network$: Observable<Network>;
    showNetworkInfo = false;

    private subscription: Subscription;

    constructor(
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private mediaObserver: MediaObserver,
        private notificationService: NotificationService,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private utilityService: UtilityService
    ) {
        this.network$ = raidenService.network$;

        this.registerIcons();
    }

    @HostListener('document:click', ['$event'])
    documentClick(event: any) {
        this.utilityService.newGlobalClick(event.target);
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }

    isSmallScreen(): boolean {
        return this.mediaObserver.isActive('lt-md');
    }

    ngOnInit() {
        this.subscription = this.network$.subscribe(network => {
            if (network.chainId !== 1) {
                this.showNetworkInfo = true;
                setTimeout(() => {
                    this.hideNetworkInfo();
                }, 5000);
            }
        });

        const channelSubscription = this.channelPollingService
            .channels()
            .subscribe();
        this.subscription.add(channelSubscription);

        const pendingTransfersSubscription = this.pendingTransferPollingService.pendingTransfers$.subscribe();
        this.subscription.add(pendingTransfersSubscription);

        const paymentHistorySubscription = this.paymentHistoryPollingService.paymentHistory$.subscribe();
        this.subscription.add(paymentHistorySubscription);

        this.disableAnimationsOnAndroid();
        this.notificationService.setNotificationSidenav(
            this.notificationSidenav
        );
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
