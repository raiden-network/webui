import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    flush,
    tick
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';
import Spy = jasmine.Spy;

import { NotificationPanelComponent } from './notification-panel.component';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { TestProviders } from '../../../../testing/test-providers';
import { PendingTransferPollingService } from '../../../services/pending-transfer-polling.service';
import { NotificationService } from '../../../services/notification.service';
import { NotificationMessage } from '../../../models/notification';
import { clickElement } from '../../../../testing/interaction-helper';

describe('NotificationPanelComponent', () => {
    let component: NotificationPanelComponent;
    let fixture: ComponentFixture<NotificationPanelComponent>;

    let notificationService;
    let notificationsSubject: BehaviorSubject<NotificationMessage[]>;
    let removeSpy: Spy;
    let clearSpy: Spy;

    const notification: NotificationMessage = {
        title: 'Testing',
        description: 'Currently testing the application.',
        identifier: 1
    };

    beforeEach(async(() => {
        notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
        notificationService = {
            notifications$: notificationsSubject.asObservable(),
            pendingActions$: of([]),
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
            imports: [
                MaterialComponentsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ],
            providers: [
                PendingTransferPollingService,
                {
                    provide: NotificationService,
                    useValue: notificationService
                },
                TestProviders.HammerJSProvider(),
                NoopAnimationsModule,
                TestProviders.MockRaidenConfigProvider()
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

        clickElement(fixture.debugElement, '.mat-icon-button');

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith(notification.identifier);
    });

    it('should be able to clear notifications', () => {
        notificationsSubject.next([notification]);
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#clear-notifications');

        expect(clearSpy).toHaveBeenCalledTimes(1);
    });
});
