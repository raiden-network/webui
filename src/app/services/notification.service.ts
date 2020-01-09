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
    private notificationsSubject = new BehaviorSubject<NotificationMessage[]>(
        []
    );
    private pendingActionsSubject = new BehaviorSubject<NotificationMessage[]>(
        []
    );

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
        return identifier;
    }

    public clearNotifications() {
        this.notifications = [];

        this.notificationsSubject.next(this.notifications);
    }

    public removeNotification(identifier: number) {
        this.notifications = this.notifications.filter(
            notification => notification.identifier !== identifier
        );
        this.notificationsSubject.next(this.notifications);
    }

    public removePendingAction(identifier: number) {
        this.pendingActions = this.pendingActions.filter(
            pendingAction => pendingAction.identifier !== identifier
        );
        this.pendingActionsSubject.next(this.pendingActions);
    }

    private get toastrService(): ToastrService {
        return this.injector.get(ToastrService);
    }

    private success(message: UiMessage) {
        this.toastrService.success(message.description, message.title);
    }

    private error(message: UiMessage) {
        this.toastrService.error(message.description, message.title);
    }

    private info(message: UiMessage) {
        this.toastrService.info(message.description, message.title);
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
        return identifier;
    }

    private getNewIdentifier(): number {
        const identifier = this.notificationCounter;
        this.notificationCounter++;
        return identifier;
    }
}
