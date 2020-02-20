import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import Spy = jasmine.Spy;

import { NotificationPanelComponent } from './notification-panel.component';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { TestProviders } from '../../../../testing/test-providers';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import { NotificationService } from '../../../services/notification.service';
import { NotificationMessage } from '../../../models/notification';
import { clickElement } from '../../../../testing/interaction-helper';
import { By } from '@angular/platform-browser';
import { ClipboardModule } from 'ngx-clipboard';
import { RaidenIconsModule } from '../../../modules/raiden-icons/raiden-icons.module';

describe('NotificationPanelComponent', () => {
    let component: NotificationPanelComponent;
    let fixture: ComponentFixture<NotificationPanelComponent>;

    let notificationService;
    let notificationsSubject: BehaviorSubject<NotificationMessage[]>;
    let pendingActionsSubject: BehaviorSubject<NotificationMessage[]>;
    let removeSpy: Spy;
    let clearSpy: Spy;

    const notification: NotificationMessage = {
        title: 'Testing',
        description: 'Currently testing the application.',
        identifier: 1,
        icon: '',
        timestamp: new Date().toISOString()
    };

    const pendingAction: NotificationMessage = {
        title: 'Testing pending',
        description: 'Test is pending.',
        identifier: 2,
        icon: '',
        timestamp: new Date().toISOString()
    };

    beforeEach(async(() => {
        notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
        pendingActionsSubject = new BehaviorSubject<NotificationMessage[]>([]);
        notificationService = {
            notifications$: notificationsSubject.asObservable(),
            pendingActions$: pendingActionsSubject.asObservable(),
            clearNotifications: () => {},
            removeNotification: () => {}
        };
        removeSpy = spyOn(notificationService, 'removeNotification');
        clearSpy = spyOn(notificationService, 'clearNotifications');

        TestBed.configureTestingModule({
            declarations: [
                NotificationPanelComponent,
                NotificationItemComponent
            ],
            providers: [
                PendingTransferPollingService,
                {
                    provide: NotificationService,
                    useValue: notificationService
                },
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider()
            ],
            imports: [
                MaterialComponentsModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                ClipboardModule,
                RaidenIconsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NotificationPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have no items by default', () => {
        expect(component.hasNoItems()).toBe(true);
    });

    it('should be able to remove notifications', () => {
        notificationsSubject.next([notification]);
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#remove');

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith(notification.identifier);
    });

    it('should be able to clear notifications', () => {
        notificationsSubject.next([notification]);
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#clear-notifications');

        expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('should render the notification items', () => {
        notificationsSubject.next([notification]);
        pendingActionsSubject.next([pendingAction]);
        fixture.detectChanges();

        const notificationItems = fixture.debugElement.queryAll(
            By.directive(NotificationItemComponent)
        );
        expect(notificationItems.length).toBe(2);
    });
});
