import { Provider } from '@angular/core';
import { HAMMER_LOADER } from '@angular/platform-browser';
import { AddressBookService } from '../app/services/address-book.service';
import { stub } from './stub';
import { RaidenConfig } from '../app/services/raiden.config';
import { MockConfig } from './mock-config';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { MockMatDialog } from './mock-mat-dialog';

export class TestProviders {
    static HammerJSProvider(): Provider {
        return {
            provide: HAMMER_LOADER,
            useValue: () => new Promise(() => {
            })
        };
    }

    static AddressBookStubProvider(): Provider {
        return {
            provide: AddressBookService,
            useFactory: () => {
                const addressBookStub = stub<AddressBookService>();
                addressBookStub.getArray = () => [];
                addressBookStub.get = () => ({});
                return addressBookStub;
            }
        };
    }

    static MockRaidenConfigProvider(): Provider {
        return {
            provide: RaidenConfig,
            useClass: MockConfig
        };
    }

    static MockMatDialogData(payload: any = {}): Provider {
        return {
            provide: MAT_DIALOG_DATA,
            useValue: payload
        };
    }

    static MockMatDialogRef(obj = {}): Provider {
        return {
            provide: MatDialogRef,
            useValue: obj
        };
    }

    static MockMatDialog() {
        return {
            provide: MatDialog,
            useClass: MockMatDialog
        };
    }
}
