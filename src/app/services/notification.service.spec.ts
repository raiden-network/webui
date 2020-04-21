import { inject, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ToastrService, ToastrModule } from 'ngx-toastr';

import { NotificationService } from './notification.service';
import { UiMessage, NotificationMessage } from '../models/notification';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NotificationService', () => {
    let toastrService: ToastrService;

    const testMessage: UiMessage = {
        title: 'Testing',
        description: 'Currently testing the application.',
        icon: '',
    };
    const testMessage2: UiMessage = {
        title: 'Further testing',
        description: 'Still testing the application.',
        icon: '',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NotificationService],
            imports: [
                ToastrModule.forRoot({ timeOut: 50, easeTime: 0 }),
                NoopAnimationsModule,
            ],
        });
    });

    beforeEach(() => {
        toastrService = TestBed.inject(ToastrService);
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

            const expectedNotification: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage
            );
            service.notifications$.subscribe((notifications) =>
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

            const expectedNotification: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage
            );
            service.notifications$.subscribe((notifications) =>
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

            const expectedNotification: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage
            );
            service.notifications$.subscribe((notifications) =>
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
        fakeAsync((service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'info').and.callThrough();
            service.addPendingAction(testMessage2);

            const expectedPendingAction: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage2
            );
            service.pendingActions$.subscribe((pendingActions) =>
                expect(pendingActions).toEqual([expectedPendingAction])
            );
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage2.description,
                testMessage2.title
            );
            flush();
        })
    ));

    it('should correctly increase the identifier for new notifications and pending actions', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            service.addSuccessNotification(testMessage);
            service.addInfoNotification(testMessage2);

            const notification1: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage
            );
            const notification2: NotificationMessage = Object.assign(
                { identifier: 1, timestamp: new Date().toISOString() },
                testMessage2
            );
            service.notifications$.subscribe((notifications) =>
                expect(notifications).toEqual([notification2, notification1])
            );

            service.addPendingAction(testMessage);
            service.addPendingAction(testMessage2);

            const pendingAction1: NotificationMessage = Object.assign(
                { identifier: 2, timestamp: new Date().toISOString() },
                testMessage
            );
            const pendingAction2: NotificationMessage = Object.assign(
                { identifier: 3, timestamp: new Date().toISOString() },
                testMessage2
            );
            service.pendingActions$.subscribe((pendingActions) =>
                expect(pendingActions).toEqual([pendingAction2, pendingAction1])
            );
            flush();
        })
    ));

    it('should be able to remove a notification', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            service.addSuccessNotification(testMessage);
            service.addErrorNotification(testMessage2);
            service.removeNotification(1);

            const expectedNotification: NotificationMessage = Object.assign(
                { identifier: 0, timestamp: new Date().toISOString() },
                testMessage
            );
            service.notifications$.subscribe((notifications) =>
                expect(notifications).toEqual([expectedNotification])
            );
            flush();
        })
    ));

    it('should be able to remove a pending action', inject(
        [NotificationService],
        fakeAsync((service: NotificationService) => {
            service.addPendingAction(testMessage);
            service.addPendingAction(testMessage2);
            service.removePendingAction(0);

            const expectedPendingAction: NotificationMessage = Object.assign(
                { identifier: 1, timestamp: new Date().toISOString() },
                testMessage2
            );
            service.pendingActions$.subscribe((pendingActions) =>
                expect(pendingActions).toEqual([expectedPendingAction])
            );
            flush();
        })
    ));

    it('should be able to remove all notifications', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addInfoNotification(testMessage);
            service.addErrorNotification(testMessage2);
            service.clearNotifications();

            service.notifications$.subscribe((notifications) =>
                expect(notifications).toEqual([])
            );
        }
    ));

    it('should emit the number of notifications', inject(
        [NotificationService],
        (service: NotificationService) => {
            let expectedValue = 0;
            service.numberOfNotifications$.subscribe((numberOfNotifications) =>
                expect(numberOfNotifications).toBe(expectedValue)
            );

            expectedValue++;
            service.addPendingAction(testMessage);

            expectedValue++;
            service.addSuccessNotification(testMessage);
            expectedValue++;
            service.addInfoNotification(testMessage2);

            expectedValue--;
            service.removePendingAction(0);

            expectedValue = 0;
            service.clearNotifications();
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
