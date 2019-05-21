import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { default as makeBlockie } from 'ethereum-blockies-base64';
import { Observable, Subscription } from 'rxjs';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { SharedService } from './services/shared.service';
import { MediaObserver } from '@angular/flex-layout';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled')
    public animationsDisabled = false;

    public title = 'Raiden';
    public raidenAddress;
    public readonly balance$: Observable<string>;

    private _pendingRequests = 0;

    get pendingRequests(): string {
        return this._pendingRequests.toString();
    }

    private sub: Subscription;
    private _menuOpen: boolean;

    constructor(
        private sharedService: SharedService,
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private media: MediaObserver
    ) {
        this._menuOpen = false;
        this.balance$ = raidenService.balance$();
    }

    get menuOpen(): boolean {
        if (!this.isMobile()) {
            return true;
        } else {
            return this._menuOpen;
        }
    }

    toggleMenu() {
        this._menuOpen = !this._menuOpen;
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

    closeMenu() {
        this._menuOpen = false;
    }
}
