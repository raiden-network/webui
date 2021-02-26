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
    mergeMap,
    switchMap,
    takeWhile,
} from 'rxjs/operators';
import { MediaObserver } from '@angular/flex-layout';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent,
} from './components/confirmation-dialog/confirmation-dialog.component';
import { Status } from './models/status';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: Animations.easeInOut,
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled') animationsDisabled = false;
    @ViewChild('menu_sidenav', { static: true })
    public menuSidenav: MatSidenav;
    @ViewChild(ToastContainerDirective, { static: true })
    private toastContainer: ToastContainerDirective;

    readonly network$: Observable<Network>;
    showNetworkInfo = false;
    apiStatus: Status;
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
        private mediaObserver: MediaObserver,
        private toastrService: ToastrService
    ) {
        this.network$ = raidenService.network$;
    }

    @HostListener('document:click', ['$event'])
    documentClick(event: any) {
        this.sharedService.newGlobalClick(event.target);
    }

    ngOnInit() {
        this.toastrService.overlayContainer = this.toastContainer;

        this.statusSubject
            .pipe(
                switchMap(() => this.raidenService.getStatus()),
                tap((status) => {
                    switch (status.status) {
                        case 'syncing': {
                            if (this.initialBlocksToSync === undefined) {
                                this.initialBlocksToSync =
                                    status.blocks_to_sync;
                            }
                            this.syncingProgress =
                                (this.initialBlocksToSync -
                                    status.blocks_to_sync) /
                                this.initialBlocksToSync;
                            break;
                        }
                        case 'ready': {
                            if (this.notificationService.rpcError) {
                                this.raidenService.attemptRpcConnection(false);
                            }
                            this.startPolling();
                            break;
                        }
                    }
                    this.apiStatus = status;
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

        this.notificationService.connectionErrors$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((errors) => {
                this.handleConnectionErrors(errors);
            });

        this.disableAnimationsOnAndroid();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('lt-lg');
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
        });

        dialog
            .afterClosed()
            .pipe(
                mergeMap((result) => {
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

    private startPolling() {
        this.channelPollingService.channels$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.pendingTransferPollingService.pendingTransfers$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.paymentHistoryPollingService.newPaymentEvents$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();
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
