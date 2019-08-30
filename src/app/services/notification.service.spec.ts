import { inject, TestBed } from '@angular/core/testing';
import { ToastrService, ToastrModule } from 'ngx-toastr';

import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';

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
            imports: [ToastrModule.forRoot()]
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

    it('should be able to add and retrieve a notification', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addNotification(testMessage);

            const expectedNotification = Object.assign(
                { identifier: 0 },
                testMessage
            );
            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([expectedNotification])
            );
        }
    ));

    it('should be able to add and retrieve a pending action', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addPendingAction(testMessage2);

            const expectedPendingAction = Object.assign(
                { identifier: 0 },
                testMessage2
            );
            service.pendingActions$.subscribe(pendingActions =>
                expect(pendingActions).toEqual([expectedPendingAction])
            );
        }
    ));

    it('should correctly increase the identifier for new notifications and pending actions', inject(
        [NotificationService],
        (service: NotificationService) => {
            service.addNotification(testMessage);
            service.addNotification(testMessage2);

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
            service.addNotification(testMessage);
            service.addNotification(testMessage2);
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
            service.addNotification(testMessage);
            service.addNotification(testMessage2);
            service.clearNotifications();

            service.notifications$.subscribe(notifications =>
                expect(notifications).toEqual([])
            );
        }
    ));

    it('should emit the number of notifications', inject(
        [NotificationService],
        (service: NotificationService) => {
            let expectatedValue = 0;
            service.numberOfNotifications$.subscribe(numberOfNotifications =>
                expect(numberOfNotifications).toBe(expectatedValue)
            );

            expectatedValue++;
            service.addPendingAction(testMessage);

            expectatedValue++;
            service.addNotification(testMessage);
            expectatedValue++;
            service.addNotification(testMessage2);

            expectatedValue--;
            service.removePendingAction(0);

            expectatedValue = 0;
            service.clearNotifications();
        }
    ));

    it('should show a notification for a success', inject(
        [NotificationService],
        (service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'success');
            service.success(testMessage);
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
        }
    ));

    it('should show a notification for an error', inject(
        [NotificationService],
        (service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'error');
            service.error(testMessage);
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
        }
    ));

    it('should show a notification for an info', inject(
        [NotificationService],
        (service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'info');
            service.info(testMessage);
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
        }
    ));

    it('should show a notification for a warning', inject(
        [NotificationService],
        (service: NotificationService) => {
            const toastrSpy = spyOn(toastrService, 'warning');
            service.warn(testMessage);
            expect(toastrSpy).toHaveBeenCalledTimes(1);
            expect(toastrSpy).toHaveBeenCalledWith(
                testMessage.description,
                testMessage.title
            );
        }
    ));

    it('should have undefined status for the error trace by default', inject(
        [NotificationService],
        (service: NotificationService) => {
            expect(service.getStackTrace()).toBe(null);
        }
    ));
});
