import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotificationItemComponent } from './notification-item.component';
import { TestProviders } from '../../../../testing/test-providers';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { NotificationMessage } from '../../../models/notification';
import { By } from '@angular/platform-browser';
import { createAddress, createToken } from '../../../../testing/test-data';
import { RaidenIconsModule } from '../../../modules/raiden-icons/raiden-icons.module';
import { ClipboardModule } from 'ngx-clipboard';
import { IdenticonCacheService } from '../../../services/identicon-cache.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('NotificationItemComponent', () => {
    let component: NotificationItemComponent;
    let fixture: ComponentFixture<NotificationItemComponent>;

    const notification: NotificationMessage = {
        title: 'Testing',
        description: 'Currently testing the application.',
        identifier: 1,
        icon: '',
        timestamp: new Date().toISOString(),
        identiconAddress: createAddress(),
        userToken: createToken(),
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NotificationItemComponent],
            providers: [
                NoopAnimationsModule,
                TestProviders.AddressBookStubProvider(),
                IdenticonCacheService,
            ],
            imports: [
                MaterialComponentsModule,
                RaidenIconsModule,
                ClipboardModule,
                HttpClientTestingModule,
            ],
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
            .query(By.css('.content__title'))
            .nativeElement.childNodes[0].textContent.trim();
        const description = fixture.debugElement.query(
            By.css('.content__description')
        ).nativeElement.innerText;
        expect(title).toBe(notification.title);
        expect(description).toBe(notification.description);
    });
});
