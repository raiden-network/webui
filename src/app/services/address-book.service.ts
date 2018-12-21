import { Injectable } from '@angular/core';
import { Address } from "../models/address";
import { LocalStorageAdapter } from "../adapters/local-storage-adapter";
// @ts-ignore
import * as Web3 from 'web3';

@Injectable({
    providedIn: 'root'
})
export class AddressBookService {
    private static ADDRESS_BOOK_KEY = "raiden__address_book";

    private storage: Storage;
    private web3: Web3;

    constructor(localStorageAdapter: LocalStorageAdapter) {
        this.storage = localStorageAdapter.localStorage;
        this.web3 = new Web3();
    }

    public saveAddress(address: Address) {
        if (!this.web3.utils.isAddress(address.address)) {
            throw Error(`${address.address} is not an ethereum address`)
        }

        if (!this.web3.utils.checkAddressChecksum(address.address)) {
            throw Error(`${address.address} is not in checksum format`)
        }

        const addresses = this.getAddresses();
        addresses.push(address);
        this.persistAddresses(addresses);
    }

    public getAddresses(): Array<Address> {

        let addresses: string = this.storage.getItem(AddressBookService.ADDRESS_BOOK_KEY);
        let addressBook: Array<Address>;

        if (!addresses) {
            addressBook = []
        } else {
            addressBook = JSON.parse(addresses);
        }

        return addressBook;
    }

    private persistAddresses(addresses: Array<Address>) {
        const addressesValue = JSON.stringify(addresses);
        this.storage.setItem(AddressBookService.ADDRESS_BOOK_KEY, addressesValue)
    }
}
