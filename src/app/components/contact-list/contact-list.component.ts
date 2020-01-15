import { Component, OnInit } from '@angular/core';
import { Contact } from '../../models/contact';
import { AddressBookService } from '../../services/address-book.service';
import { StringUtils } from '../../utils/string.utils';
import { Animations } from '../../animations/animations';
import { MatDialog } from '@angular/material/dialog';
import { AddAddressDialogComponent } from '../add-address-dialog/add-address-dialog.component';

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

    constructor(
        private addressBookService: AddressBookService,
        private dialog: MatDialog
    ) {}

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

    private updateVisibleContacts() {
        if (this.showAll) {
            this.visibleContacts = this.contacts;
        } else {
            this.visibleContacts = this.contacts.slice(0, 2);
        }
    }
}
