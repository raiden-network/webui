import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter
} from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { NotificationMessage } from '../../../models/notification';
import { Animations } from '../../../animations/animations';

@Component({
    selector: 'app-notification-panel',
    templateUrl: './notification-panel.component.html',
    styleUrls: ['./notification-panel.component.css'],
    animations: Animations.flyInOut
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
    @Output() close: EventEmitter<boolean> = new EventEmitter();
    public notifications: NotificationMessage[];
    public pendingActions: NotificationMessage[];

    private subscription: Subscription;

    constructor(private notificationService: NotificationService) {}

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
        this.subscription.add(pendingActionsSubscription);
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
