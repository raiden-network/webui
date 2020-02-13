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
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';
import { AddEditContactDialogComponent } from '../add-edit-contact-dialog/add-edit-contact-dialog.component';
import { matchesContact } from '../../shared/keyword-matcher';

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
    private subscription: Subscription;
    private searchFilter = '';

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
        this.subscription = this.sharedService.globalClickTarget$.subscribe(
            target => {
                if (
                    !this.contactsElement.nativeElement.contains(target) &&
                    this.dialog.openDialogs.length === 0
                ) {
                    this.selectedContactAddress = '';
                }
            }
        );

        const searchSubscription = this.sharedService.searchFilter$.subscribe(
            value => {
                this.searchFilter = value;
                this.updateContacts();
            }
        );
        this.subscription.add(searchSubscription);

        this.updateContacts();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
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
                    title: 'Contact import',
                    description: 'Successfully imported contacts'
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
            message = 'Only json files are allowed';
        } else if (error.multiple) {
            message = 'Only a single file is supported';
        } else if (error.exceedsUploadLimit) {
            message = `The file exceeds the max allowed size of ${
                error.exceedsUploadLimit
            } bytes`;
        } else {
            message = 'The uploaded file is not in a valid format';
        }
        const title = 'Contact import failed';
        console.error(`${title}: ${message}`);
        this.notificationService.addErrorNotification({
            title: title,
            description: message
        });
    }
}
