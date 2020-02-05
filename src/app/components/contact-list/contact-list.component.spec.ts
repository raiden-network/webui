import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactListComponent } from './contact-list.component';
import { ContactComponent } from '../contact/contact.component';
import { ContactActionsComponent } from '../contact/contact-actions/contact-actions.component';
import { TestProviders } from '../../../testing/test-providers';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NotificationService } from '../../services/notification.service';
import { UtilityService } from '../../services/utility.service';
import { createTestContacts, createAddress } from '../../../testing/test-data';
import { AddressBookService } from '../../services/address-book.service';
import { clickElement } from '../../../testing/interaction-helper';
import { By } from '@angular/platform-browser';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import {
    AddEditContactDialogPayload,
    AddEditContactDialogComponent
} from '../add-edit-contact-dialog/add-edit-contact-dialog.component';
import { Contact, Contacts } from '../../models/contact';
import { stub } from '../../../testing/stub';
import { ToastrModule } from 'ngx-toastr';
import { UploadChecks } from '../../shared/upload-checks';

function createMockReader(result: {}) {
    return {
        result: JSON.stringify(result),
        readAsText: function() {
            this.onprogress();
            this.onload();
        },
        onload: () => {},
        onprogress: () => {}
    };
}

function createMockFileList(...filenames: string[]): FileList {
    const files: File[] = [];
    filenames.forEach(filename => {
        const file = stub<File>();
        // @ts-ignore
        file.name = filename;
        // @ts-ignore
        file.size = 120 * 1024;
        files.push(file);
    });

    const fileList = stub<FileList>();
    // @ts-ignore
    fileList.length = files.length;
    // @ts-ignore
    fileList.item = function(index: number) {
        return files[index];
    };

    return fileList;
}

describe('ContactListComponent', () => {
    let component: ContactListComponent;
    let fixture: ComponentFixture<ContactListComponent>;

    let addressBookService: AddressBookService;
    const contacts = createTestContacts();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ContactListComponent,
                ContactComponent,
                ContactActionsComponent
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.MockMatDialog(),
                NotificationService,
                UtilityService
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
                ToastrModule.forRoot()
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactListComponent);
        component = fixture.componentInstance;

        addressBookService = TestBed.get(AddressBookService);
        addressBookService.getArray = () => contacts;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display 2 contacts by default', () => {
        expect(component.visibleContacts.length).toBe(2);
    });

    it('should be able to display all contacts', () => {
        clickElement(fixture.debugElement, '#show-all');
        fixture.detectChanges();
        expect(component.visibleContacts.length).toBe(contacts.length);
    });

    it('should select a contact on click', () => {
        const contactElement = fixture.debugElement.query(
            By.directive(ContactComponent)
        );
        clickElement(contactElement, '.card');
        fixture.detectChanges();
        expect(component.selectedContactAddress).toBe(contacts[0].address);
    });

    it('should deselect the contact on a second click', () => {
        const contactElement = fixture.debugElement.query(
            By.directive(ContactComponent)
        );
        clickElement(contactElement, '.card');
        fixture.detectChanges();
        clickElement(contactElement, '.card');
        fixture.detectChanges();
        expect(component.selectedContactAddress).toBe('');
    });

    it('should deselect the contact when clicked elsewhere', () => {
        const utilityService: UtilityService = TestBed.get(UtilityService);
        const contactElement = fixture.debugElement.query(
            By.directive(ContactComponent)
        );
        clickElement(contactElement, '.card');
        fixture.detectChanges();
        utilityService.newGlobalClick(document.createElement('div'));
        fixture.detectChanges();
        expect(component.selectedContactAddress).toBe('');
    });

    it('should open add contact dialog', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: Contact = {
            address: createAddress(),
            label: 'New test account'
        };
        dialog.returns = () => dialogResult;
        const saveSpy = spyOn(addressBookService, 'save');
        clickElement(fixture.debugElement, '#add');

        const payload: AddEditContactDialogPayload = {
            address: '',
            label: '',
            edit: false
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(AddEditContactDialogComponent, {
            data: payload,
            width: '360px'
        });
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(dialogResult);
    });

    it('should download the contacts as a json file', () => {
        clickElement(fixture.debugElement, '#options');
        fixture.detectChanges();

        const elementSpy = jasmine.createSpyObj('a', [
            'dispatchEvent',
            'setAttribute'
        ]);
        elementSpy.setAttribute = function(attr, value) {
            this[attr] = value;
        };
        const createElementSpy = spyOn(
            document,
            'createElement'
        ).and.returnValue(elementSpy);
        addressBookService.createExportURL = () =>
            'blob:http://localhost/mockpath';

        clickElement(fixture.debugElement, '#export');
        fixture.detectChanges();

        expect(createElementSpy).toHaveBeenCalledTimes(1);
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(elementSpy.href).toBe('blob:http://localhost/mockpath');
        expect(elementSpy.target).toBe('_blank');
        expect(elementSpy.download).toBe('address-book.json');
        expect(elementSpy.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(elementSpy.dispatchEvent).toHaveBeenCalledWith(
            new MouseEvent('click')
        );
    });

    it('should import the uploaded json contacts', () => {
        const reader = window['FileReader'];

        const result: Contacts = {};
        const data = createTestContacts(2);
        data.forEach(contact => {
            result[contact.address] = contact.label;
        });
        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };
        const fileList = createMockFileList('address_book.json');

        const storeSpy = spyOn(addressBookService, 'store');
        component.filesSelected(fileList);

        expect(storeSpy).toHaveBeenCalledTimes(1);
        expect(storeSpy).toHaveBeenCalledWith(result, true);

        window['FileReader'] = reader;
    });

    it('should show an error if invalid json content is parsed', () => {
        const reader = window['FileReader'];

        const result = { fake: true, invalid: 'yes' };
        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };
        const fileList = createMockFileList('address_book.json');

        const notificationService: NotificationService = TestBed.get(
            NotificationService
        );
        const storeSpy = spyOn(addressBookService, 'store');
        const notificationSpy = spyOn(
            notificationService,
            'addErrorNotification'
        );
        component.filesSelected(fileList);

        const errorMessage = {
            title: 'Contact import failed',
            description: 'The uploaded file is not in a valid format'
        };
        expect(storeSpy).toHaveBeenCalledTimes(0);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(errorMessage);

        window['FileReader'] = reader;
    });

    it('should show an error if wrong file extension is passed', () => {
        const reader = window['FileReader'];

        const result: Contacts = {};
        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };
        const fileList = createMockFileList('image.png');

        const notificationService: NotificationService = TestBed.get(
            NotificationService
        );
        const storeSpy = spyOn(addressBookService, 'store');
        const notificationSpy = spyOn(
            notificationService,
            'addErrorNotification'
        );
        component.filesSelected(fileList);

        const errorMessage = {
            title: 'Contact import failed',
            description: 'Only json files are allowed'
        };
        expect(storeSpy).toHaveBeenCalledTimes(0);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(errorMessage);

        window['FileReader'] = reader;
    });

    it('should show an error if multiple files are selected for upload', () => {
        const reader = window['FileReader'];

        const result: Contacts = {};
        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };
        const fileList = createMockFileList(
            'address_book.json',
            'more_address.json'
        );

        const notificationService: NotificationService = TestBed.get(
            NotificationService
        );
        const storeSpy = spyOn(addressBookService, 'store');
        const notificationSpy = spyOn(
            notificationService,
            'addErrorNotification'
        );
        component.filesSelected(fileList);

        const errorMessage = {
            title: 'Contact import failed',
            description: 'Only a single file is supported'
        };
        expect(storeSpy).toHaveBeenCalledTimes(0);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(errorMessage);

        window['FileReader'] = reader;
    });

    it('should show an error if selected file exceeds the upload limit', () => {
        const reader = window['FileReader'];

        const result: Contacts = {};
        // @ts-ignore
        window['FileReader'] = class {
            constructor() {
                return createMockReader(result);
            }
        };
        const fileList = createMockFileList('address_book.json');
        // @ts-ignore
        fileList.item(0).size = UploadChecks.MAX_UPLOAD_SIZE + 1;

        const notificationService: NotificationService = TestBed.get(
            NotificationService
        );
        const storeSpy = spyOn(addressBookService, 'store');
        const notificationSpy = spyOn(
            notificationService,
            'addErrorNotification'
        );
        component.filesSelected(fileList);

        const errorMessage = {
            title: 'Contact import failed',
            description: `The file exceeds the max allowed size of ${
                UploadChecks.MAX_UPLOAD_SIZE
            } bytes`
        };
        expect(storeSpy).toHaveBeenCalledTimes(0);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(errorMessage);

        window['FileReader'] = reader;
    });
});
