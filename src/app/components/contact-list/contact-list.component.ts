import { Component, OnInit } from '@angular/core';
import { Contact } from '../../models/contact';
import { AddressBookService } from '../../services/address-book.service';
import { StringUtils } from '../../utils/string.utils';
import { Animations } from '../../animations/animations';
import { MatDialog } from '@angular/material/dialog';
import { AddAddressDialogComponent } from '../add-address-dialog/add-address-dialog.component';
import { UploadChecks } from '../../shared/upload-checks';
import { ValidateFunction } from 'ajv';
import * as Ajv from 'ajv';
import { contactsSchema } from '../../models/contacts-schema';
import { NotificationService } from '../../services/notification.service';
import { UploadError } from '../../models/upload-error';

@Component({
    selector: 'app-contact-list',
    templateUrl: './contact-list.component.html',
    styleUrls: ['./contact-list.component.css'],
    animations: Animations.flyInOut
})
export class ContactListComponent implements OnInit {
    visibleContacts: Contact[] = [];
    totalContacts = 0;
    showAll = false;
    selectedIndex = -1;

    private contacts: Contact[] = [];
    private readonly uploadChecks: UploadChecks = new UploadChecks();
    private readonly schema: ValidateFunction;

    constructor(
        private addressBookService: AddressBookService,
        private dialog: MatDialog,
        private notificationService: NotificationService
    ) {
        const validator = new Ajv({ allErrors: true });
        this.schema = validator.compile(contactsSchema);
    }

    ngOnInit() {
        this.updateContacts();
    }

    trackByFn(index, item: Contact) {
        return item.address;
    }

    toggleShowAll() {
        this.showAll = !this.showAll;
        this.updateVisibleContacts();
    }

    setSelectedIndex(index: number) {
        this.selectedIndex = this.selectedIndex === index ? -1 : index;
    }

    addContact() {
        const dialog = this.dialog.open(AddAddressDialogComponent);

        dialog.afterClosed().subscribe(value => {
            if (!value) {
                return;
            }

            this.addressBookService.save(value);
            this.updateContacts();
        });
    }

    updateContacts() {
        this.selectedIndex = -1;
        this.contacts = this.addressBookService.getArray();
        this.totalContacts = this.contacts.length;
        this.contacts.sort((a, b) =>
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
            this.showImportError(e);
        }
    }

    private updateVisibleContacts() {
        if (this.showAll) {
            this.visibleContacts = this.contacts;
        } else {
            this.visibleContacts = this.contacts.slice(0, 2);
        }
    }

    private uploadContacts(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            const json = JSON.parse(reader.result as string);

            if (this.schema(json)) {
                this.addressBookService.store(json, true);
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
        let errorMessage: string;
        if (error.invalidExtension) {
            errorMessage = 'Only json files are allowed';
        } else if (error.multiple) {
            errorMessage = 'Only a single file is supported';
        } else if (error.invalidFormat) {
            errorMessage = 'The uploaded file is not in a valid format';
        } else {
            errorMessage = `The file exceeds the max allowed size of ${
                error.exceedsUploadLimit
            } bytes`;
        }
        const title = 'Contact import failed';
        console.error(`${title}: ${errorMessage}`);
        this.notificationService.addErrorNotification({
            title: title,
            description: errorMessage
        });
    }
}
