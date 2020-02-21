import { Injectable } from '@angular/core';
import { Contact, Contacts } from '../models/contact';
import { LocalStorageAdapter } from '../adapters/local-storage-adapter';
import * as Utils from 'web3-utils';
import { contactsSchema } from '../models/contacts-schema';
import * as Ajv from 'ajv';
import { ValidateFunction } from 'ajv';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AddressBookService {
    private static ADDRESS_BOOK_KEY = 'raiden__address_book';

    private storage: Storage;
    private readonly schema: ValidateFunction;
    private addressBookUpdateSubject = new BehaviorSubject<void>(null);

    constructor(localStorageAdapter: LocalStorageAdapter) {
        this.storage = localStorageAdapter.localStorage;

        const validator = new Ajv({ allErrors: true });
        this.schema = validator.compile(contactsSchema);
    }

    getObservableArray(): Observable<Contact[]> {
        return this.addressBookUpdateSubject.pipe(
            map(() => {
                const contacts = this.get();
                return Object.keys(contacts).map(value => {
                    return {
                        address: value,
                        label: contacts[value]
                    };
                });
            })
        );
    }

    save(contact: Contact) {
        if (!Utils.isAddress(contact.address)) {
            throw Error(`${contact.address} is not an ethereum address`);
        }

        if (!Utils.checkAddressChecksum(contact.address)) {
            throw Error(`${contact.address} is not in checksum format`);
        }

        const contacts = this.get();
        contacts[contact.address] = contact.label;
        this.store(contacts);
    }

    get(): Contacts {
        const unparsedContacts: string = this.storage.getItem(
            AddressBookService.ADDRESS_BOOK_KEY
        );
        let contacts: Contacts;

        if (!unparsedContacts) {
            contacts = {};
        } else {
            contacts = JSON.parse(unparsedContacts);
        }

        return contacts;
    }

    store(contacts: Contacts, merge: boolean = false) {
        const isValid = this.schema(contacts);

        if (!isValid) {
            throw Error(
                this.schema.errors.map(value => value.message).join(', ')
            );
        }

        let data: Contacts;
        if (merge) {
            data = Object.assign(this.get(), contacts);
        } else {
            data = contacts;
        }

        const stringifiedContacts = JSON.stringify(data);
        this.storage.setItem(
            AddressBookService.ADDRESS_BOOK_KEY,
            stringifiedContacts
        );
        this.addressBookUpdateSubject.next();
    }

    delete(contact: Contact) {
        const contacts = this.get();
        const numberOfKeys = Object.keys(contacts).length;
        delete contacts[contact.address];

        if (numberOfKeys > Object.keys(contacts).length) {
            this.store(contacts);
        }
    }

    createExportURL() {
        let json: string = this.storage.getItem(
            AddressBookService.ADDRESS_BOOK_KEY
        );
        if (!json) {
            json = JSON.stringify({});
        }
        const blob = new Blob([json], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    deleteAll() {
        this.store({});
    }
}
