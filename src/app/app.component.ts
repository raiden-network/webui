import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    HostListener,
} from '@angular/core';
import { Observable, Subject, EMPTY, BehaviorSubject } from 'rxjs';
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
import {
    takeUntil,
    tap,
    delay,
    flatMap,
    switchMap,
    takeWhile,
} from 'rxjs/operators';
import { MediaObserver } from '@angular/flex-layout';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from './components/confirmation-dialog/confirmation-dialog.component';
import { Status } from './models/status';

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
    apiStatus: Status = { status: 'ready' };
    syncingProgress = 0;
    didShutdown = false;

    private ngUnsubscribe = new Subject();
    private errorDialog: MatDialogRef<ErrorComponent>;
    private statusSubject: BehaviorSubject<void> = new BehaviorSubject(null);
    private initialBlocksToSync: number | undefined = undefined;

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
        this.statusSubject
            .pipe(
                switchMap(() => this.raidenService.getStatus()),
                tap((status) => {
                    this.apiStatus = status;
                    if (status.status === 'syncing') {
                        if (this.initialBlocksToSync === undefined) {
                            this.initialBlocksToSync = status.blocks_to_sync;
                        }
                        this.syncingProgress =
                            (this.initialBlocksToSync - status.blocks_to_sync) /
                            this.initialBlocksToSync;
                    }
                }),
                takeUntil(this.ngUnsubscribe),
                takeWhile((status) => status.status !== 'ready'),
                delay(500),
                tap(() => this.statusSubject.next(null))
            )
            .subscribe();

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

    shutdownRaiden() {
        this.closeMenu();

        const payload: ConfirmationDialogPayload = {
            title: 'Shutdown',
            message: 'Are you sure you want to shut down your Raiden Node?',
        };
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((result) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.shutdownRaiden();
                })
            )
            .subscribe(() => {
                this.didShutdown = true;
            });
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
                this.didShutdown = false;
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
