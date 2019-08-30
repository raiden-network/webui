import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { NotificationMessage } from '../../../models/notification';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import { Animations } from '../../../animations/animations';

@Component({
    selector: 'app-notification-panel',
    templateUrl: './notification-panel.component.html',
    styleUrls: ['./notification-panel.component.css'],
    animations: Animations.flyInOut
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
    public notifications: NotificationMessage[];
    public pendingActions: NotificationMessage[];

    private subscription: Subscription;

    constructor(
        private notificationService: NotificationService,
        private pendingTransferPollingService: PendingTransferPollingService
    ) {}

    ngOnInit() {
        this.subscription = this.notificationService.notifications$.subscribe(
            (notifications: NotificationMessage[]) => {
                this.notifications = notifications;
            }
        );
        const pendingActionsSubscription = this.notificationService.pendingActions$.subscribe(
            (pendingActions: NotificationMessage[]) => {
                this.pendingActions = pendingActions;
            }
        );
        const pendingTransfersSubscription = this.pendingTransferPollingService.pendingTransfers$.subscribe();

        this.subscription.add(pendingActionsSubscription);
        this.subscription.add(pendingTransfersSubscription);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    trackByFn(index, item: NotificationMessage) {
        return item.identifier;
    }

    removeNotification(notificationIdentifier: number) {
        this.notificationService.removeNotification(notificationIdentifier);
    }

    clearNotifications() {
        this.notificationService.clearNotifications();
    }

    hasNoItems() {
        return (
            this.notifications.length === 0 && this.pendingActions.length === 0
        );
    }
}
