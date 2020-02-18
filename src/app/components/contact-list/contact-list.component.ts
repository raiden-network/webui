import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef
} from '@angular/core';
import { Contact } from '../../models/contact';
import { AddressBookService } from '../../services/address-book.service';
import { StringUtils } from '../../utils/string.utils';
import { Animations } from '../../animations/animations';
import { MatDialog } from '@angular/material/dialog';
import { UploadChecks } from '../../shared/upload-checks';
import { ValidateFunction } from 'ajv';
import * as Ajv from 'ajv';
import { contactsSchema } from '../../models/contacts-schema';
import { NotificationService } from '../../services/notification.service';
import { UploadError } from '../../models/upload-error';
import { Subject } from 'rxjs';
import { SharedService } from '../../services/shared.service';
import { AddEditContactDialogComponent } from '../add-edit-contact-dialog/add-edit-contact-dialog.component';
import { matchesContact } from '../../shared/keyword-matcher';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-contact-list',
    templateUrl: './contact-list.component.html',
    styleUrls: ['./contact-list.component.css'],
    animations: Animations.flyInOut
})
export class ContactListComponent implements OnInit, OnDestroy {
    @ViewChild('contact_list', { static: true })
    private contactsElement: ElementRef;

    visibleContacts: Contact[] = [];
    totalContacts = 0;
    numberOfFilteredContacts = 0;
    showAll = false;
    selectedContactAddress = '';

    private filteredContacts: Contact[] = [];
    private readonly uploadChecks: UploadChecks = new UploadChecks();
    private readonly schema: ValidateFunction;
    private searchFilter = '';
    private ngUnsubscribe = new Subject();

    constructor(
        private addressBookService: AddressBookService,
        private dialog: MatDialog,
        private notificationService: NotificationService,
        private sharedService: SharedService
    ) {
        const validator = new Ajv({ allErrors: true });
        this.schema = validator.compile(contactsSchema);
    }

    ngOnInit() {
        this.sharedService.globalClickTarget$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(target => {
                if (
                    !this.contactsElement.nativeElement.contains(target) &&
                    this.dialog.openDialogs.length === 0
                ) {
                    this.selectedContactAddress = '';
                }
            });

        this.sharedService.searchFilter$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(value => {
                this.searchFilter = value;
                this.updateContacts();
            });

        this.updateContacts();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    trackByFn(index, item: Contact) {
        return item.address;
    }

    toggleShowAll() {
        this.showAll = !this.showAll;
        this.updateVisibleContacts();
    }

    setSelection(contact: Contact) {
        this.selectedContactAddress = this.isSelected(contact)
            ? ''
            : contact.address;
    }

    isSelected(contact: Contact): boolean {
        return contact.address === this.selectedContactAddress;
    }

    addContact() {
        const dialog = this.dialog.open(AddEditContactDialogComponent, {
            data: { address: '', label: '', edit: false },
            width: '360px'
        });

        dialog.afterClosed().subscribe((result?: Contact) => {
            if (result) {
                this.addressBookService.save(result);
                this.updateContacts();
            }
        });
    }

    updateContacts() {
        const contacts = this.addressBookService.getArray();
        this.totalContacts = contacts.length;

        this.filteredContacts = contacts.filter(contact =>
            matchesContact(this.searchFilter, contact)
        );
        this.numberOfFilteredContacts = this.filteredContacts.length;

        this.filteredContacts.sort((a, b) =>
            StringUtils.compare(true, a.label, b.label)
        );
        this.updateVisibleContacts();
    }

    downloadContacts() {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = this.addressBookService.createExportURL();
        link.setAttribute('visibility', 'hidden');
        link.setAttribute('download', 'address-book.json');
        link.dispatchEvent(new MouseEvent('click'));
    }

    filesSelected(files: FileList) {
        try {
            const file = UploadChecks.check(files, 'json');
            this.uploadContacts(file);
        } catch (e) {
            this.showImportError(e.error);
        }
    }

    private updateVisibleContacts() {
        if (this.showAll) {
            this.visibleContacts = this.filteredContacts;
        } else {
            this.visibleContacts = this.filteredContacts.slice(0, 2);
        }
    }

    private uploadContacts(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            const result = JSON.parse(reader.result as string);

            if (this.schema(result)) {
                this.addressBookService.store(result, true);
                this.updateContacts();
                this.notificationService.addSuccessNotification({
                    title: 'Contacts import',
                    description: 'successful',
                    icon: 'info'
                });
            } else {
                this.showImportError({ invalidFormat: true });
            }
        };

        reader.readAsText(file);
    }

    private showImportError(error: UploadError) {
        let message: string;
        if (error.invalidExtension) {
            message = 'Only json files allowed';
        } else if (error.multiple) {
            message = 'Only single file supported';
        } else if (error.exceedsUploadLimit) {
            message = `Max allowed size of ${
                error.exceedsUploadLimit
            } bytes exceeded`;
        } else {
            message = 'Invalid file format';
        }
        const title = 'Contacts import';
        console.error(`${title}: ${message}`);
        this.notificationService.addErrorNotification({
            title: title,
            description: message,
            icon: 'error-mark'
        });
    }
}
