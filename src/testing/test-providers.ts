import { Provider } from '@angular/core';
import { AddressBookService } from '../app/services/address-book.service';
import { stub } from './stub';
import { RaidenConfig } from '../app/services/raiden.config';
import { MockConfig } from './mock-config';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { MockMatDialog } from './mock-mat-dialog';
import { of } from 'rxjs';
import { NotificationService } from 'app/services/notification.service';

export class TestProviders {
    static AddressBookStubProvider(): Provider {
        return {
            provide: AddressBookService,
            useFactory: () => {
                const addressBookStub = stub<AddressBookService>();
                addressBookStub.getObservableArray = () => of([]);
                addressBookStub.get = () => ({});
                addressBookStub.save = () => {};
                addressBookStub.delete = () => {};
                addressBookStub.store = () => {};
                return addressBookStub;
            },
        };
    }

    static MockRaidenConfigProvider(): Provider {
        return {
            provide: RaidenConfig,
            useClass: MockConfig,
        };
    }

    static MockMatDialogData(payload: any = {}): Provider {
        return {
            provide: MAT_DIALOG_DATA,
            useValue: payload,
        };
    }

    static MockMatDialogRef(obj = {}): Provider {
        return {
            provide: MatDialogRef,
            useValue: obj,
        };
    }

    static MockMatDialog() {
        return {
            provide: MatDialog,
            useClass: MockMatDialog,
        };
    }

    static SpyNotificationServiceProvider(): Provider {
        return {
            provide: NotificationService,
            useFactory: () => {
                const notificationService = jasmine.createSpyObj(
                    'NotificationService',
                    [
                        'addPendingAction',
                        'removePendingAction',
                        'addSuccessNotification',
                        'addInfoNotification',
                        'addErrorNotification',
                    ]
                );
                notificationService.apiError = undefined;
                return notificationService;
            },
        };
    }
}
