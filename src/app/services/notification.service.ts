import { Inject, Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, BehaviorSubject } from 'rxjs';
import { UiMessage, NotificationMessage } from '../models/notification';
import { MatSidenav } from '@angular/material/sidenav';
import {
    ConnectionErrors,
    ApiErrorResponse
} from '../models/connection-errors';

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
    private connectionErrorsSubject = new BehaviorSubject<ConnectionErrors>({});

    public readonly notifications$: Observable<
        NotificationMessage[]
    > = this.notificationsSubject.asObservable();
    public readonly pendingActions$: Observable<
        NotificationMessage[]
    > = this.pendingActionsSubject.asObservable();
    public readonly connectionErrors$: Observable<
        ConnectionErrors
    > = this.connectionErrorsSubject.asObservable();

    private notifications: NotificationMessage[] = [];
    private pendingActions: NotificationMessage[] = [];
    private notificationCounter = 0;
    private connectionErrors: ConnectionErrors = {};
    private sidenav: MatSidenav;

    constructor(@Inject(Injector) private injector: Injector) {}

    public get rpcError(): Error {
        return this.connectionErrors.rpcError;
    }

    public get apiError(): ApiErrorResponse {
        return this.connectionErrors.apiError;
    }

    public set rpcError(error: Error) {
        this.connectionErrors.rpcError = error;
        this.connectionErrorsSubject.next(this.connectionErrors);
    }

    public set apiError(error: ApiErrorResponse) {
        this.connectionErrors.apiError = error;
        this.connectionErrorsSubject.next(this.connectionErrors);
    }

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
                ...message,
                identifier: identifier,
                timestamp: new Date().toISOString()
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

    public setNotificationSidenav(sidenav: MatSidenav) {
        this.sidenav = sidenav;
    }

    public toggleSidenav() {
        this.sidenav.toggle();
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
                ...message,
                identifier: identifier,
                timestamp: new Date().toISOString()
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
