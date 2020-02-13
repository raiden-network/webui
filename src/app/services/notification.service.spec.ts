import { inject, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ToastrService, ToastrModule } from 'ngx-toastr';

import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NotificationService', () => {
    let toastrService: ToastrService;

    const testMessage: UiMessage = {
        title: 'Testing',
        description: 'Currently testing the application.'
    };
    const testMessage2: UiMessage = {
        title: 'Further testing',
        description: 'Still testing the application.'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NotificationService],
            imports: [
                ToastrModule.forRoot({ timeOut: 50, easeTime: 0 }),
                NoopAnimationsModule
            ]
        });
    });

    beforeEach(() => {
        toastrService = TestBed.get(ToastrService);
    });

    it('should be created', inject(
        [NotificationService],
        (service: NotificationService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should be able to add and retrieve a notification for success', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'success').and.callThrough();

            service.addSuccessNotification(testMessage);
            tick(50);

            const expectedNotification = Object.assign(
                { identifier: 0 },
                testMessage
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([expectedNotification])
            );
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
            flush();
        })
    ));

    it('should be able to add and retrieve a notification for info', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'info').and.callThrough();
            service.addInfoNotification(testMessage);
            tick(50);

            const expectedNotification = Object.assign(
                { identifier: 0 },
                testMessage
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([expectedNotification])
            );
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
            flush();
        })
    ));

    it('should be able to add and retrieve a notification for error', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'error').and.callThrough();

            service.addErrorNotification(testMessage);
            tick(50);

            const expectedNotification = Object.assign(
                { identifier: 0 },
                testMessage
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([expectedNotification])
            );
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
            flush();
        })
    ));

    it('should be able to add and retrieve a pending action', inject(
        [NotificationService],
        (service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'info').and.callThrough();

            service.addPendingAction(testMessage2);

            const expectedPendingAction = Object.assign(
                { identifier: 0 },
                testMessage2
            );
            service.pendingActions$.subscribe(pendingActions =>
                expect(pendingActions).toEqual([expectedPendingAction])
            );
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage2.description,
                testMessage2.title
            );
        }
    ));

    it('should correctly increase the identifier for new notifications and pending actions', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addSuccessNotification(testMessage);
            service.addInfoNotification(testMessage2);

            const notification1 = Object.assign({ identifier: 0 }, testMessage);
            const notification2 = Object.assign(
                { identifier: 1 },
                testMessage2
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([notification2, notification1])
            );

            service.addPendingAction(testMessage);
            service.addPendingAction(testMessage2);

            const pendingAction1 = Object.assign(
                { identifier: 2 },
                testMessage
            );
            const pendingAction2 = Object.assign(
                { identifier: 3 },
                testMessage2
            );
            service.pendingActions$.subscribe(pendingActions =>
                expect(pendingActions).toEqual([pendingAction2, pendingAction1])
            );
        }
    ));

    it('should be able to remove a notification', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addSuccessNotification(testMessage);
            service.addErrorNotification(testMessage2);
            service.removeNotification(1);

            const expectedNotification = Object.assign(
                { identifier: 0 },
                testMessage
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([expectedNotification])
            );
        }
    ));

    it('should be able to remove a pending action', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addPendingAction(testMessage);
            service.addPendingAction(testMessage2);
            service.removePendingAction(0);

            const expectedPendingAction = Object.assign(
                { identifier: 1 },
                testMessage2
            );
            service.pendingActions$.subscribe(pendingActions =>
                expect(pendingActions).toEqual([expectedPendingAction])
            );
        }
    ));

    it('should be able to remove all notifications', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addInfoNotification(testMessage);
            service.addErrorNotification(testMessage2);
            service.clearNotifications();

            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([])
            );
        }
    ));

    it('should have null status for the errors by default', inject(
        [NotificationService],
        (service: NotificationService) => {
            expect(service.apiError).toBe(undefined);
            expect(service.rpcError).toBe(undefined);
        }
    ));
});
