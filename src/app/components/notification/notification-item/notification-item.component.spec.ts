import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotificationItemComponent } from './notification-item.component';
import { TestProviders } from '../../../../testing/test-providers';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { NotificationMessage } from '../../../models/notification';
import { By } from '@angular/platform-browser';

describe('NotificationItemComponent', () => {
    let component: NotificationItemComponent;
    let fixture: ComponentFixture<NotificationItemComponent>;

    const notification: NotificationMessage = {
        title: 'Testing',
        description: 'Currently testing the application.',
        identifier: 1
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NotificationItemComponent],
            imports: [MaterialComponentsModule],
            providers: [TestProviders.HammerJSProvider(), NoopAnimationsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NotificationItemComponent);
        component = fixture.componentInstance;
        component.notification = notification;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the notification data', () => {
        const title = fixture.debugElement
            .query(By.css('.mat-card-title'))
            .nativeElement.childNodes[0].textContent.trim();
        const description = fixture.debugElement.query(
            By.css('.mat-card-content')
        ).nativeElement.innerText;
        expect(title).toBe(notification.title);
        expect(description).toBe(notification.description);
    });
});
