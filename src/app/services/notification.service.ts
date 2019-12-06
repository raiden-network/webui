import { Inject, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { scan } from 'rxjs/operators';
import { UiMessage, NotificationMessage } from '../models/notification';

export interface ApiErrorResponse extends HttpErrorResponse {
    retrying?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private numberOfNotificationsSubject = new BehaviorSubject<number>(0);
    private newNotificationSubject = new Subject<void>();
    private notificationsSubject = new BehaviorSubject<NotificationMessage[]>(
        []
    );
    private pendingActionsSubject = new BehaviorSubject<NotificationMessage[]>(
        []
    );

    public readonly numberOfNotifications$: Observable<
        number
    > = this.numberOfNotificationsSubject
        .asObservable()
        .pipe(scan((acc, value) => Math.max(acc + value, 0), 0));
    public readonly newNotification$: Observable<
        void
    > = this.newNotificationSubject.asObservable();
    public readonly notifications$: Observable<
        NotificationMessage[]
    > = this.notificationsSubject.asObservable();
    public readonly pendingActions$: Observable<
        NotificationMessage[]
    > = this.pendingActionsSubject.asObservable();
    public rpcError: Error = null;
    public apiError: ApiErrorResponse = null;

    private notifications: NotificationMessage[] = [];
    private pendingActions: NotificationMessage[] = [];
    private notificationCounter = 0;

    constructor(@Inject(Injector) private injector: Injector) {}

    public addSuccessNotification(message: UiMessage): number {
        this.success(message);
        return this.addNotification(message);
    }

    public addInfoNotification(message: UiMessage): number {
        this.info(message);
        return this.addNotification(message);
    }

    public addErrorNotification(message: UiMessage): number {
        this.error(message);
        return this.addNotification(message);
    }

    public addPendingAction(message: UiMessage): number {
        this.info(message);
        const identifier = this.getNewIdentifier();

        this.pendingActions = [
            {
                identifier,
                title: message.title,
                description: message.description
            },
            ...this.pendingActions
        ];

        this.pendingActionsSubject.next(this.pendingActions);
        this.numberOfNotificationsSubject.next(+1);
        return identifier;
    }

    public clearNotifications() {
        this.numberOfNotificationsSubject.next(-this.notifications.length);

        this.notifications = [];

        this.notificationsSubject.next(this.notifications);
    }

    public removeNotification(identifier: number) {
        this.notifications = this.notifications.filter(notification => {
            if (notification.identifier === identifier) {
                this.numberOfNotificationsSubject.next(-1);
                return false;
            }
            return true;
        });
        this.notificationsSubject.next(this.notifications);
    }

    public removePendingAction(identifier: number) {
        this.pendingActions = this.pendingActions.filter(pendingAction => {
            if (pendingAction.identifier === identifier) {
                this.numberOfNotificationsSubject.next(-1);
                return false;
            }
            return true;
        });
        this.pendingActionsSubject.next(this.pendingActions);
    }

    private get toastrService(): ToastrService {
        return this.injector.get(ToastrService);
    }

    private success(message: UiMessage) {
        this.toastrService
            .success(message.description, message.title)
            .onHidden.subscribe(() => {
                this.newNotificationSubject.next(null);
            });
    }

    private error(message: UiMessage) {
        this.toastrService
            .error(message.description, message.title)
            .onHidden.subscribe(() => {
                this.newNotificationSubject.next(null);
            });
    }

    private info(message: UiMessage) {
        this.toastrService
            .info(message.description, message.title)
            .onHidden.subscribe(() => {
                this.newNotificationSubject.next(null);
            });
    }

    private addNotification(message: UiMessage): number {
        const identifier = this.getNewIdentifier();

        this.notifications = [
            {
                identifier,
                title: message.title,
                description: message.description
            },
            ...this.notifications
        ];

        this.notificationsSubject.next(this.notifications);
        this.numberOfNotificationsSubject.next(+1);
        return identifier;
    }

    private getNewIdentifier(): number {
        const identifier = this.notificationCounter;
        this.notificationCounter++;
        return identifier;
    }
}
