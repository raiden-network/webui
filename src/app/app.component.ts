import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';
import { default as makeBlockie } from 'ethereum-blockies-base64';
import { Observable, Subscription, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSidenav } from '@angular/material';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { SharedService } from './services/shared.service';
import { MediaObserver } from '@angular/flex-layout';
import { Network } from './utils/network-info';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled')
    public animationsDisabled = false;
    @ViewChild('menu_sidenav')
    public menuSidenav: MatSidenav;

    public title = 'Raiden';
    public raidenAddress;
    public readonly balance$: Observable<string>;
    public readonly network$: Observable<Network>;
    public readonly production: boolean;
    public readonly faucetLink$: Observable<string>;

    private _pendingRequests = 0;

    get pendingRequests(): string {
        return this._pendingRequests.toString();
    }

    private sub: Subscription;

    constructor(
        private sharedService: SharedService,
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private media: MediaObserver
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
        return this.media.isActive('xs');
    }

    ngOnInit() {
        this.raidenService.raidenAddress$.subscribe(
            address => (this.raidenAddress = address)
        );
        this.sub = this.sharedService.pendingRequests.subscribe(
            pendingRequests => {
                setTimeout(() => {
                    this._pendingRequests = pendingRequests;
                });
            }
        );
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
        return this.sharedService.getStackTrace() !== null;
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
