import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
} from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { Subject } from 'rxjs';
import { NotificationMessage } from '../../../models/notification';
import { Animations } from '../../../animations/animations';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-notification-panel',
    templateUrl: './notification-panel.component.html',
    styleUrls: ['./notification-panel.component.scss'],
    animations: Animations.flyInOut,
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
    @Output() closing: EventEmitter<boolean> = new EventEmitter();
    public notifications: NotificationMessage[];
    public pendingActions: NotificationMessage[];

    private ngUnsubscribe = new Subject();

    constructor(private notificationService: NotificationService) {}

    ngOnInit() {
        this.notificationService.notifications$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((notifications: NotificationMessage[]) => {
                this.notifications = notifications;
            });

        this.notificationService.pendingActions$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((pendingActions: NotificationMessage[]) => {
                this.pendingActions = pendingActions;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
