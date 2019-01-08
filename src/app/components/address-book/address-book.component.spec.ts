import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressBookComponent } from './address-book.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AddressBookItemComponent } from '../address-book-item/address-book-item.component';
import { DragUploadDirective } from '../../directives/drag-upload.directive';
import { AddressBookService } from '../../services/address-book.service';
import { stub } from '../../../testing/stub';
// @ts-ignore
import * as Web3 from 'web3';
import { Address } from '../../models/address';
import { MatDialog } from '@angular/material';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';

describe('AddressBookComponent', () => {
    let component: AddressBookComponent;
    let fixture: ComponentFixture<AddressBookComponent>;
    let serviceStub: AddressBookService;

    beforeEach(async(() => {
        serviceStub = stub();

        const web3 = new Web3();
        const addresses: Address[] = [];

        for (let i = 0; i < 15; i++) {
            const account = web3.eth.accounts.create(web3.utils.randomHex(32));
            addresses.push({
                address: account.address,
                label: `Random Account ${i + 1}`
            });
        }

        serviceStub.getArray = () => addresses;

        TestBed.configureTestingModule({
            declarations: [
                AddressBookComponent,
                AddressBookItemComponent,
                DragUploadDirective
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule
            ],
            providers: [
                {
                    provide: AddressBookService,
                    useFactory: () => serviceStub
                },
                {
                    provide: MatDialog,
                    useClass: MockMatDialog
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressBookComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
