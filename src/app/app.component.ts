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
import { NotificationService } from './services/notification.service';
import { Animations } from './animations/animations';
import { PendingTransferPollingService } from './services/pending-transfer-polling.service';
import { PaymentHistoryPollingService } from './services/payment-history-polling.service';
import { Network } from './utils/network-info';
import { UtilityService } from './services/utility.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
    ConnectionErrors,
    ConnectionErrorType
} from './models/connection-errors';
import {
    ErrorComponent,
    ErrorPayload
} from './components/error/error.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: Animations.easeInOut
})
export class AppComponent implements OnInit, OnDestroy {
    @HostBinding('@.disabled')
    public animationsDisabled = false;
    @ViewChild('notification_sidenav', { static: true })
    public notificationSidenav: MatSidenav;

    readonly network$: Observable<Network>;
    showNetworkInfo = false;

    private subscription: Subscription;
    private errorDialog: MatDialogRef<ErrorComponent>;

    constructor(
        private raidenService: RaidenService,
        private channelPollingService: ChannelPollingService,
        private pendingTransferPollingService: PendingTransferPollingService,
        private paymentHistoryPollingService: PaymentHistoryPollingService,
        private notificationService: NotificationService,
        private utilityService: UtilityService,
        private dialog: MatDialog
    ) {
        this.network$ = raidenService.network$;
    }

    @HostListener('document:click', ['$event'])
    documentClick(event: any) {
        this.utilityService.newGlobalClick(event.target);
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

        const connectionErrorsSubscription = this.notificationService.connectionErrors$.subscribe(
            errors => {
                this.handleConnectionErrors(errors);
            }
        );
        this.subscription.add(connectionErrorsSubscription);

        this.disableAnimationsOnAndroid();
        this.notificationService.setNotificationSidenav(
            this.notificationSidenav
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    hideNetworkInfo() {
        this.showNetworkInfo = false;
    }

    private handleConnectionErrors(errors: ConnectionErrors) {
        let errorPayload: ErrorPayload;
        if (errors.apiError) {
            errorPayload = {
                type: ConnectionErrorType.ApiError,
                errorContent: errors.apiError.message
            };
        } else if (errors.rpcError) {
            errorPayload = {
                type: ConnectionErrorType.RpcError,
                errorContent: errors.rpcError.stack
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
                panelClass: 'grey-dialog'
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
