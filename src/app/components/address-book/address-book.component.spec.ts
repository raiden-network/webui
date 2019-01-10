import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

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
import { Address, Addresses } from '../../models/address';
import { MatDialog } from '@angular/material';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { By } from '@angular/platform-browser';
import { clickElement, mockInput } from '../../../testing/interaction-helper';
import { DebugElement } from '@angular/core';

describe('AddressBookComponent', () => {
    let component: AddressBookComponent;
    let fixture: ComponentFixture<AddressBookComponent>;
    let serviceStub: AddressBookService;

    function getLabels(debugElement: DebugElement): string[] {
        return debugElement.children.map(value => {
            return value.queryAll(By.css('input'))[1].nativeElement as HTMLInputElement;
        }).map(value => value.value);
    }

    function getExpected(start: number, end: number): string[] {
        const expectations: string[] = [];
        for (let number = start; number < end + 1; number++) {
            expectations.push(`Random Account ${number}`);
        }
        return expectations;
    }

    function createData(count: number = 15): Address[] {
        const web3 = new Web3();
        const addresses: Address[] = [];

        for (let i = 0; i < count; i++) {
            const account = web3.eth.accounts.create(web3.utils.randomHex(32));
            addresses.push({
                address: account.address,
                label: `Random Account ${i + 1}`
            });
        }

        return addresses;
    }

    beforeEach(async(() => {
        serviceStub = stub();

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
    });

    it('should create', () => {
        serviceStub.getArray = () => createData();
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should display 10 of 15 items by default', function () {
        serviceStub.getArray = () => createData();
        fixture.detectChanges();

        const paginatorLabel = fixture.debugElement.query(By.css('.mat-paginator-range-label'));
        const addressListElement = fixture.debugElement.query(By.css('.page-list'));
        expect((paginatorLabel.nativeElement as HTMLDivElement).textContent).toBe('1 - 10 of 15');
        expect(addressListElement.children.length).toBe(10);

        expect(getLabels(addressListElement)).toEqual(getExpected(1, 10));
    });

    it('should display 5 items after changing page', async(function () {
        serviceStub.getArray = () => createData();
        fixture.detectChanges();

        clickElement(fixture.debugElement, '.mat-paginator-navigation-next');
        fixture.detectChanges();
        const paginatorLabel = fixture.debugElement.query(By.css('.mat-paginator-range-label'));
        const addressListElement = fixture.debugElement.query(By.css('.page-list'));
        expect((paginatorLabel.nativeElement as HTMLDivElement).textContent).toBe('11 - 15 of 15');
        expect(addressListElement.children.length).toBe(5);

        expect(getLabels(addressListElement)).toEqual(getExpected(11, 15));
    }));

    it('should add an address when pressing add', function () {
        const addresses: Address[] = [];
        serviceStub.getArray = () => addresses;
        serviceStub.save = address => addresses.push(address);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list'))).toBeNull();

        mockInput(fixture.debugElement, '#addresses-address', '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C');
        mockInput(fixture.debugElement, '#addresses-label', 'Test Node');

        fixture.detectChanges();

        clickElement(fixture.debugElement, '#addresses-save');

        fixture.detectChanges();

        const addressListElement = fixture.debugElement.query(By.css('.page-list'));
        expect(addressListElement.children.length).toBe(1);
        expect(getLabels(addressListElement)).toEqual(['Test Node']);
    });

    it('should delete all nodes when user confirms delete all', function () {
        let addresses: Address[] = createData();
        serviceStub.getArray = () => addresses;
        serviceStub.deleteAll = () => addresses = [];

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list')).children.length).toBe(10);

        clickElement(fixture.debugElement, '#addresses-delete');

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list'))).toBeNull();

    });

    it('should delete nothing if user presses cancel on the delete confirmation', function () {
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.cancelled = true;

        // noinspection JSMismatchedCollectionQueryUpdate
        let addresses: Address[] = createData();
        serviceStub.getArray = () => addresses;
        serviceStub.deleteAll = () => addresses = [];

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list')).children.length).toBe(10);

        clickElement(fixture.debugElement, '#addresses-delete');

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.page-list')).children.length).toBe(10);

    });

    it('should only be able to edit one element at a time', function () {
        serviceStub.getArray = () => createData();
        fixture.detectChanges();

        const debugElements = fixture.debugElement.query(By.css('.page-list')).children;

        const addressInput = (element: DebugElement) => element.query(By.css('#address-label')).nativeElement as HTMLInputElement;

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

    it('should expand the drop zone when import is pressed', function () {
        serviceStub.getArray = () => [];
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeFalsy();
        clickElement(fixture.debugElement, '#addresses-import');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeTruthy();
        clickElement(fixture.debugElement, '#addresses-import');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#drop-zone'))).toBeFalsy();
    });

    it('should show an empty view if no data', function () {
        serviceStub.getArray = () => [];
        fixture.detectChanges();

        const emptyText = (fixture.debugElement.query(By.css('h2.mat-title')).nativeElement as HTMLHeadElement).textContent;
        const addressListElement = fixture.debugElement.query(By.css('.page-list'));
        expect(addressListElement).toBeNull();
        expect(emptyText).toBe('No addresses found!');
    });

    it('should hide the drop area and import the addresses', fakeAsync(function () {
        let imported: Addresses = null;
        serviceStub.store = addresses => imported = addresses;
        serviceStub.getArray = () => [];

        fixture.detectChanges();

        const reader = window['FileReader'];
        const result = {};
        const data = createData(2);

        for (let i = 0; i < data.length; i++) {
            result[data[i].address] = data[i].label;
        }

        const mockReader = {
            result: JSON.stringify(result),
            readAsText: function () {
                this.onload();
            },
            onload: () => {
            }
        };

        window['FileReader'] = () => mockReader;

        expect(fixture.debugElement.query(By.css('.page-list'))).toBeFalsy();
        serviceStub.getArray = () => data;

        const file = stub<File>();
        component.filesSelected(file);
        tick(1000);
        expect(component.showDropArea).toBe(false);
        expect(imported).toEqual(result);

        fixture.detectChanges();
        tick();

        expect(fixture.debugElement.query(By.css('.page-list')).children.length).toEqual(2);
        window['FileReader'] = reader;

        flush();
    }));

    it('should have an error if the import fails', function () {
        const reader = window['FileReader'];

        const mockReader = {
            result: '',
            readAsText: function () {
                this.onload();
            },
            onload: () => {
            }
        };

        serviceStub.store = () => {
            throw new Error('invalid');
        };

        window['FileReader'] = () => mockReader;

        const file = stub<File>();
        component.filesSelected(file);

        expect(component.uploadError).toEqual(jasmine.objectContaining({invalidFormat: true}));

        window['FileReader'] = reader;
    });

    it('should download a json file', function () {
        const spy = jasmine.createSpyObj('a', ['click', 'setAttribute']);
        spy.setAttribute = function (attr, value) {
            this[attr] = value;
        };

        spyOn(document, 'createElement').and.returnValue(spy);
        serviceStub.createExportURL = () => 'blob:http://localhost/mockpath';

        component.saveAddresses();

        expect(document.createElement).toHaveBeenCalledTimes(1);
        expect(document.createElement).toHaveBeenCalledWith('a');

        expect(spy.href).toBe('blob:http://localhost/mockpath');
        expect(spy.target).toBe('_blank');
        expect(spy.download).toBe('address-book');
        expect(spy.click).toHaveBeenCalledTimes(1);
    });

});

