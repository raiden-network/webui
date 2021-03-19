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
import { NEVER, of } from 'rxjs';
import { NotificationService } from 'app/services/notification.service';
import { UserDepositService } from 'app/services/user-deposit.service';
import { UserToken } from 'app/models/usertoken';
import BigNumber from 'bignumber.js';
import { createToken } from './test-data';

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

    static MockMatDialogRef(): Provider {
        return {
            provide: MatDialogRef,
            useValue: { close: () => {} },
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

    static MockUserDepositService(
        servicesToken?: UserToken,
        balance?: BigNumber
    ): Provider {
        return {
            provide: UserDepositService,
            useFactory: () => {
                const userDepositMock = stub<UserDepositService>();
                // @ts-ignore
                userDepositMock.balance$ = of(
                    balance ?? new BigNumber('750000000000000000')
                );
                // @ts-ignore
                userDepositMock.servicesToken$ = of(
                    servicesToken ?? createToken()
                );
                // @ts-ignore
                userDepositMock.withdrawPlan$ = of({
                    amount: new BigNumber(0),
                    withdrawBlock: 0,
                });
                // @ts-ignore
                userDepositMock.blocksUntilWithdraw$ = NEVER;
                userDepositMock.refreshWithdrawPlan = () => {};
                userDepositMock.deposit = () => of(null);
                userDepositMock.planWithdraw = () => of(null);
                userDepositMock.withdraw = () => of(null);
                return userDepositMock;
            },
        };
    }
}
