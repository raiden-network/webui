import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressBookComponent } from './address-book.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AddressBookItemComponent } from '../address-book-item/address-book-item.component';
import { DragUploadDirective } from '../../directives/drag-upload.directive';
import { AddressBookService } from '../../services/address-book.service';
import { Address, Addresses } from '../../models/address';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { By } from '@angular/platform-browser';
import {
    clickElement,
    mockInput,
    errorMessage
} from '../../../testing/interaction-helper';
import { DebugElement } from '@angular/core';
import { TestProviders } from '../../../testing/test-providers';
import { createTestAddresses } from '../../../testing/test-data';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { PageBaseComponent } from '../page/page-base/page-base.component';
import { AddressInputComponent } from '../address-input/address-input.component';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs/internal/observable/of';
import Spy = jasmine.Spy;

describe('AddressBookComponent', () => {
    let component: AddressBookComponent;
    let fixture: ComponentFixture<AddressBookComponent>;
    let serviceStub: AddressBookService;
    let mobileSpy: Spy;

    function getLabels(debugElement: DebugElement): string[] {
        return debugElement.children
            .map(value => {
                return value.queryAll(By.css('input'))[1]
                    .nativeElement as HTMLInputElement;
            })
            .map(value => value.value);
    }

    function getExpected(start: number, end: number): string[] {
        const expectations: string[] = [];
        for (let number = start; number < end + 1; number++) {
            expectations.push(`Random Account ${number}`);
        }
        return expectations;
    }

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddressBookComponent,
                AddressBookItemComponent,
                PageBaseComponent,
                PageItemComponent,
                AddressInputComponent,
                FileUploadComponent,
                DragUploadDirective
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                HttpClientTestingModule
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.MockMatDialog(),
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ]
        }).compileComponents();
        serviceStub = TestBed.get(AddressBookService);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressBookComponent);
        component = fixture.componentInstance;
        mobileSpy = spyOn(component, 'isMobile').and.returnValue(false);
    });

    it('should create', () => {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should display 10 of 15 items by default', function() {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();

        const paginatorLabel = fixture.debugElement.query(
            By.css('.mat-paginator-range-label')
        );
        const addressListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(
            (paginatorLabel.nativeElement as HTMLDivElement).textContent
        ).toBe('1 – 10 of 15');
        expect(addressListElement.children.length).toBe(10);

        expect(getLabels(addressListElement)).toEqual(getExpected(1, 10));
    });

    it('should display 5 items after changing page', async(function() {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();

        clickElement(fixture.debugElement, '.mat-paginator-navigation-next');
        fixture.detectChanges();
        const paginatorLabel = fixture.debugElement.query(
            By.css('.mat-paginator-range-label')
        );
        const addressListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(
            (paginatorLabel.nativeElement as HTMLDivElement).textContent
        ).toBe('11 – 15 of 15');
        expect(addressListElement.children.length).toBe(5);

        expect(getLabels(addressListElement)).toEqual(getExpected(11, 15));
    }));

    it('should add an address when pressing add', function() {
        const addresses: Address[] = [];
        serviceStub.getArray = () => addresses;
        serviceStub.save = address => addresses.push(address);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list'))).toBeNull();

        mockInput(
            fixture.debugElement,
            `input[placeholder='Address']`,
            '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
        );
        mockInput(fixture.debugElement, '#addresses-label', 'Test Node');

        fixture.detectChanges();

        clickElement(fixture.debugElement, '#addresses-save');

        fixture.detectChanges();

        const addressListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(addressListElement.children.length).toBe(1);
        expect(getLabels(addressListElement)).toEqual(['Test Node']);
    });

    it('should delete all nodes when user confirms delete all', function() {
        let addresses: Address[] = createTestAddresses();
        serviceStub.getArray = () => {
            return addresses;
        };
        serviceStub.deleteAll = () => (addresses = []);

        fixture.detectChanges();

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(10);

        clickElement(fixture.debugElement, '#addresses-delete');

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list'))).toBeNull();
    });

    it('should delete nothing if user presses cancel on the delete confirmation', function() {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.cancelled = true;

        // noinspection JSMismatchedCollectionQueryUpdate
        let addresses: Address[] = createTestAddresses();
        serviceStub.getArray = () => addresses;
        serviceStub.deleteAll = () => (addresses = []);

        fixture.detectChanges();

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(10);

        clickElement(fixture.debugElement, '#addresses-delete');

        fixture.detectChanges();

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(10);
    });

    it('should only be able to edit one element at a time', function() {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();

        const debugElements = fixture.debugElement.query(By.css('.page-list'))
            .children;

        const addressInput = (element: DebugElement) =>
            element.query(By.css('#address-label'))
                .nativeElement as HTMLInputElement;

        debugElements.forEach(value => {
            expect(addressInput(value).disabled).toBe(true);
        });

        clickElement(debugElements[0], '#edit-address');
        fixture.detectChanges();

        expect(addressInput(debugElements[0]).disabled).toBe(false);
        for (let i = 1; i < debugElements.length; i++) {
            expect(addressInput(debugElements[i]).disabled).toBe(true);
        }

        clickElement(debugElements[1], '#edit-address');
        fixture.detectChanges();

        expect(addressInput(debugElements[0]).disabled).toBe(true);
        expect(addressInput(debugElements[1]).disabled).toBe(false);

        for (let i = 2; i < debugElements.length; i++) {
            expect(addressInput(debugElements[i]).disabled).toBe(true);
        }

        clickElement(debugElements[1], '#cancel-edit');
        fixture.detectChanges();

        debugElements.forEach(value => {
            expect(addressInput(value).disabled).toBe(true);
        });
    });

    it('should expand the drop zone when import is pressed', function() {
        serviceStub.getArray = () => [];
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeFalsy();
        clickElement(fixture.debugElement, '#addresses-import');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeTruthy();
        clickElement(fixture.debugElement, '#addresses-import');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeFalsy();
    });

    it('should show an empty view if no data', function() {
        serviceStub.getArray = () => [];
        fixture.detectChanges();

        const emptyText = (fixture.debugElement.query(By.css('h2.mat-title'))
            .nativeElement as HTMLHeadElement).textContent;
        const addressListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(addressListElement).toBeNull();
        expect(emptyText).toBe('No addresses found!');
    });

    it('should download a json file', function() {
        const spy = jasmine.createSpyObj('a', [
            'dispatchEvent',
            'setAttribute'
        ]);
        spy.setAttribute = function(attr, value) {
            this[attr] = value;
        };

        spyOn(document, 'createElement').and.returnValue(spy);
        serviceStub.createExportURL = () => 'blob:http://localhost/mockpath';

        component.saveAddresses();

        expect(document.createElement).toHaveBeenCalledTimes(1);
        expect(document.createElement).toHaveBeenCalledWith('a');

        expect(spy.href).toBe('blob:http://localhost/mockpath');
        expect(spy.target).toBe('_blank');
        expect(spy.download).toBe('address-book.json');
        expect(spy.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(spy.dispatchEvent).toHaveBeenCalledWith(new MouseEvent('click'));
    });

    it('should update stored data when the user updates a label', function() {
        const testAddresses = createTestAddresses(5);
        serviceStub.getArray = () => testAddresses;
        serviceStub.save = function(address: Address) {
            const index = testAddresses.findIndex(
                value => value.address === address.address
            );
            testAddresses[index] = address;
        };
        fixture.detectChanges();

        const debugElements = fixture.debugElement.query(By.css('.page-list'))
            .children;

        const addressInput = (element: DebugElement) =>
            element.query(By.css('#address-label'))
                .nativeElement as HTMLInputElement;

        const inputElement = addressInput(debugElements[0]);
        expect(inputElement.value).toEqual('Random Account 1');
        clickElement(debugElements[0], '#edit-address');
        fixture.detectChanges();
        mockInput(debugElements[0], '#address-label', 'An Account');
        clickElement(debugElements[0], '#edit-address');
        fixture.detectChanges();
        expect(testAddresses[0].label).toBe('An Account');
    });

    it('should do nothing on mobile if the user cancels the add dialog', async function() {
        mobileSpy.and.returnValue(of(true));

        const testAddresses = [];
        serviceStub.getArray = () => testAddresses;

        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.cancelled = true;
        fixture.detectChanges();
        await fixture.whenStable();

        clickElement(fixture.debugElement, '#open-add-dialog');

        fixture.detectChanges();

        const emptyText = (fixture.debugElement.query(By.css('h2.mat-title'))
            .nativeElement as HTMLHeadElement).textContent;
        const addressListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(addressListElement).toBeNull();
        expect(emptyText).toBe('No addresses found!');
    });

    it('should save the entry and refresh on mobile if the user confirms the dialog', async function() {
        mobileSpy.and.returnValue(of(true));

        const testAddresses = [];
        serviceStub.getArray = () => testAddresses;
        serviceStub.save = function(address: Address) {
            const index = testAddresses.findIndex(
                value => value.address === address.address
            );

            if (index < 0) {
                testAddresses.push(address);
            } else {
                testAddresses[index] = address;
            }
        };

        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.returns = () => ({
            address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C',
            label: 'Test Node'
        });
        fixture.detectChanges();
        await fixture.whenStable();

        clickElement(fixture.debugElement, '#open-add-dialog');

        fixture.detectChanges();
        await fixture.whenStable();

        expect(testAddresses.length).toBe(1);

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(1);
    });

    it('should delete an address from the list when delete is called', async function() {
        const testAddresses = createTestAddresses(2);
        serviceStub.getArray = () => testAddresses;
        serviceStub.save = function(address: Address) {
            const index = testAddresses.findIndex(
                value => value.address === address.address
            );

            if (index < 0) {
                testAddresses.push(address);
            } else {
                testAddresses[index] = address;
            }
        };
        serviceStub.delete = function(address: Address) {
            const index = testAddresses.findIndex(
                value => value.address === address.address
            );

            if (index > -1) {
                testAddresses.splice(index, 1);
            }
        };

        fixture.detectChanges();
        await fixture.whenStable();

        expect(testAddresses.length).toBe(2);

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(2);

        component.deleteAddress(testAddresses[0]);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(testAddresses.length).toBe(1);

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(1);
    });

    it('should display the addresses when the user imports them', async function() {
        const testAddresses: Address[] = [];
        serviceStub.getArray = () => testAddresses;
        serviceStub.store = function(addresses: Addresses) {
            for (const address in addresses) {
                if (!addresses.hasOwnProperty(address)) {
                    continue;
                }
                testAddresses.push({
                    address: address,
                    label: addresses[address]
                });
            }
        };

        fixture.detectChanges();
        await fixture.whenStable();

        expect(testAddresses.length).toBe(0);

        expect(fixture.debugElement.query(By.css('.page-list'))).toBe(null);

        const testData = createTestAddresses(5);
        const addressDict: Addresses = {};
        testData.forEach(value => {
            addressDict[value.address] = value.label;
        });
        component.importAddresses(addressDict);

        fixture.detectChanges();
        await fixture.whenStable();

        expect(testAddresses.length).toBe(5);

        expect(
            fixture.debugElement.query(By.css('.page-list')).children.length
        ).toBe(5);
    });

    it('should not show an error without a user input', () => {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors for the label of a new entry while the user types', () => {
        serviceStub.getArray = () => createTestAddresses();
        fixture.detectChanges();

        mockInput(fixture.debugElement, '#addresses-label', '');
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'The label cannot be empty!'
        );
    });
});
