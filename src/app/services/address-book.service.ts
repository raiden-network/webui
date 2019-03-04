import { Injectable } from '@angular/core';
import { Address, Addresses } from '../models/address';
import { LocalStorageAdapter } from '../adapters/local-storage-adapter';
import * as Utils from 'web3-utils';
import { addressSchema } from '../models/address-schema';
import * as Ajv from 'ajv';
import { ValidateFunction } from 'ajv';

@Injectable({
    providedIn: 'root'
})
export class AddressBookService {
    private static ADDRESS_BOOK_KEY = 'raiden__address_book';

    private storage: Storage;
    private readonly schema: ValidateFunction;

    constructor(localStorageAdapter: LocalStorageAdapter) {
        this.storage = localStorageAdapter.localStorage;

        const validator = new Ajv({ allErrors: true });
        this.schema = validator.compile(addressSchema);
    }

    public save(address: Address) {
        if (!Utils.isAddress(address.address)) {
            throw Error(`${address.address} is not an ethereum address`);
        }

        if (!Utils.checkAddressChecksum(address.address)) {
            throw Error(`${address.address} is not in checksum format`);
        }

        const addresses = this.get();
        addresses[address.address] = address.label;
        this.store(addresses);
    }

    public get(): Addresses {
        const addresses: string = this.storage.getItem(
            AddressBookService.ADDRESS_BOOK_KEY
        );
        let addressBook: Addresses;

        if (!addresses) {
            addressBook = {};
        } else {
            addressBook = JSON.parse(addresses);
        }

        return addressBook;
    }

    store(addresses: Addresses, merge: boolean = false) {
        const isValid = this.schema(addresses);

        if (!isValid) {
            throw Error(
                this.schema.errors.map(value => value.message).join(', ')
            );
        }

        let data: Addresses;
        if (merge) {
            data = Object.assign(this.get(), addresses);
        } else {
            data = addresses;
        }

        const addressesValue = JSON.stringify(data);
        this.storage.setItem(
            AddressBookService.ADDRESS_BOOK_KEY,
            addressesValue
        );
    }

    public delete(address: Address) {
        const addresses = this.get();
        const numberOfKeys = Object.keys(addresses).length;
        delete addresses[address.address];

        if (numberOfKeys > Object.keys(addresses).length) {
            this.store(addresses);
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

    getArray(): Array<Address> {
        const addresses = this.get();
        return Object.keys(addresses).map(value => {
            return {
                address: value,
                label: addresses[value]
            };
        });
    }

    deleteAll() {
        this.store({});
    }
}
