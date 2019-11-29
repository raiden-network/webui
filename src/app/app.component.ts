import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { default as makeBlockie } from 'ethereum-blockies-base64';
import { Observable, Subscription, zip } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { MediaObserver } from '@angular/flex-layout';
import { Network } from './utils/network-info';
import { NotificationService } from './services/notification.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled')
    public animationsDisabled = false;
    @ViewChild('menu_sidenav', { static: true })
    public menuSidenav: MatSidenav;

    public title = 'Raiden';
    public raidenAddress: string;
    public readonly balance$: Observable<string>;
    public readonly network$: Observable<Network>;
    public readonly production: boolean;
    public readonly faucetLink$: Observable<string>;
    public notificationBlink = 'none';

    private _numberOfNotifications = 0;

    get pendingRequests(): string {
        return this._numberOfNotifications.toString();
    }

    private sub: Subscription;

    constructor(
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private mediaObserver: MediaObserver,
        private notificationService: NotificationService
    ) {
        this.balance$ = raidenService.balance$;
        this.network$ = raidenService.network$;
        this.production = raidenService.production;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }

    ngOnInit() {
        this.raidenService.raidenAddress$.subscribe(
            address => (this.raidenAddress = address)
        );
        this.sub = this.notificationService.numberOfNotifications$.subscribe(
            numberOfNotifications => {
                this._numberOfNotifications = numberOfNotifications;
            }
        );

        const newNotificationSubscription = this.notificationService.newNotification$
            .pipe(
                tap(() => {
                    this.notificationBlink = 'rgba(255, 255, 255, 0.5)';
                }),
                delay(150),
                tap(() => {
                    this.notificationBlink = 'black';
                })
            )
            .subscribe();
        this.sub.add(newNotificationSubscription);

        const pollingSubscription = this.channelPollingService
            .channels()
            .subscribe();
        this.sub.add(pollingSubscription);

        this.disableAnimationsOnAndroid();
    }

    private disableAnimationsOnAndroid() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.indexOf('android') > -1;
        if (isAndroid) {
            this.animationsDisabled = true;
        }
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    // noinspection JSMethodCanBeStatic
    identicon(address: string): string {
        if (address) {
            return makeBlockie(address);
        } else {
            return '';
        }
    }

    hasRpcError(): boolean {
        return this.notificationService.getStackTrace() !== null;
    }

    getRpcErrorTrace(): string {
        return this.notificationService.getStackTrace();
    }

    attemptConnection() {
        this.raidenService.attemptConnection();
    }

    toggleMenu() {
        this.menuSidenav.toggle();
    }

    closeMenu() {
        if (this.isMobile()) {
            this.menuSidenav.close();
        }
    }
}
