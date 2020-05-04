import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    HostListener,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenService } from './services/raiden.service';
import { NotificationService } from './services/notification.service';
import { Animations } from './animations/animations';
import { PendingTransferPollingService } from './services/pending-transfer-polling.service';
import { PaymentHistoryPollingService } from './services/payment-history-polling.service';
import { Network } from './utils/network-info';
import { SharedService } from './services/shared.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
    ConnectionErrors,
    ConnectionErrorType,
} from './models/connection-errors';
import {
    ErrorComponent,
    ErrorPayload,
} from './components/error/error.component';
import { takeUntil, tap, delay } from 'rxjs/operators';
import { MediaObserver } from '@angular/flex-layout';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: Animations.easeInOut,
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled') animationsDisabled = false;
    @ViewChild('notification_sidenav', { static: true })
    private notificationSidenav: MatSidenav;
    @ViewChild('menu_sidenav', { static: true })
    public menuSidenav: MatSidenav;

    readonly network$: Observable<Network>;
    showNetworkInfo = false;

    private ngUnsubscribe = new Subject();
    private errorDialog: MatDialogRef<ErrorComponent>;

    constructor(
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private notificationService: NotificationService,
        private sharedService: SharedService,
        private dialog: MatDialog,
        private mediaObserver: MediaObserver
    ) {
        this.network$ = raidenService.network$;
    }

    @HostListener('document:click', ['$event'])
    documentClick(event: any) {
        this.sharedService.newGlobalClick(event.target);
    }

    ngOnInit() {
        this.network$
            .pipe(
                tap((network) => {
                    if (network.chainId !== 1) {
                        this.showNetworkInfo = true;
                    }
                }),
                delay(5000),
                tap(() => this.hideNetworkInfo()),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe();

        this.channelPollingService.channels$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.pendingTransferPollingService.pendingTransfers$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.paymentHistoryPollingService.paymentHistory$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.notificationService.connectionErrors$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((errors) => {
                this.handleConnectionErrors(errors);
            });

        this.disableAnimationsOnAndroid();
        this.notificationService.setNotificationSidenav(
            this.notificationSidenav
        );
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }

    closeMenu() {
        if (this.isMobile()) {
            this.menuSidenav.close();
        }
    }

    hideNetworkInfo() {
        this.showNetworkInfo = false;
    }

    private handleConnectionErrors(errors: ConnectionErrors) {
        let errorPayload: ErrorPayload;
        if (errors.apiError) {
            errorPayload = {
                type: ConnectionErrorType.ApiError,
                errorContent: errors.apiError.message,
            };
        } else if (errors.rpcError) {
            errorPayload = {
                type: ConnectionErrorType.RpcError,
                errorContent: errors.rpcError.stack,
            };
        }
        this.updateErrorDialog(errorPayload);
    }

    private updateErrorDialog(payload: ErrorPayload) {
        if (!payload) {
            if (this.errorDialog) {
                this.errorDialog.close();
                this.errorDialog = undefined;
            }
            return;
        }

        if (this.errorDialog) {
            this.errorDialog.componentInstance.data = payload;
        } else {
            this.errorDialog = this.dialog.open(ErrorComponent, {
                data: payload,
                width: '500px',
                disableClose: true,
                panelClass: 'grey-dialog',
            });
        }
    }

    private disableAnimationsOnAndroid() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = userAgent.indexOf('android') > -1;
        if (isAndroid) {
            this.animationsDisabled = true;
        }
    }
}
