import { inject, TestBed } from '@angular/core/testing';

import { AddressBookService } from './address-book.service';
import { Address } from "../models/address";
import { LocalStorageAdapter } from "../adapters/local-storage-adapter";

describe('AddressBookService', () => {

    function storageMock(): Storage {
        let storage = {};

        return {
            setItem: function (key, value) {
                storage[key] = value || '';
            },
            getItem: function (key) {
                return key in storage ? storage[key] : null;
            },
            removeItem: function (key) {
                delete storage[key];
            },
            get length() {
                return Object.keys(storage).length;
            },
            key: function (i) {
                const keys = Object.keys(storage);
                return keys[i] || null;
            },
            clear(): void {
                storage = {}
            }
        };
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AddressBookService,
                {
                    provide: LocalStorageAdapter,
                    useFactory: () => {
                        let storage = storageMock();
                        return {
                            get localStorage(): Storage {
                                return storage
                            }
                        };
                    }
                },
            ]
        });
    });

    it('should be created', inject([AddressBookService], (service: AddressBookService) => {
        expect(service).toBeTruthy();
    }));

    it('should be able to save and retrieve an address', inject([AddressBookService], (service: AddressBookService) => {

        const address: Address = {
            label: "Mah Address",
            address: "0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C"
        };

        let addresses = service.getAddresses();
        expect(addresses.length).toBe(0);

        service.saveAddress(address);

        addresses = service.getAddresses();
        expect(addresses.length).toBe(1);
        expect(addresses[0]).toEqual(address);
    }));

    it('should throw an error is the address is not an address', inject([AddressBookService], (service: AddressBookService) => {
        const address: Address = {
            label: "Mah Address",
            address: "112231"
        };

        try {
            service.saveAddress(address);
            fail('There should be an exception before')
        } catch (e) {
            expect(e.message).toEqual(`${address.address} is not an ethereum address`)
        }
    }));


    it('should throw an error is the address is not in checksum format', inject([AddressBookService], (service: AddressBookService) => {
        const address: Address = {
            label: "Mah Address",
            address: "0x504300c525cbe91adb3fe0944fe1f56f5162c75c"
        };

        try {
            service.saveAddress(address);
            fail('There should be an exception before')
        } catch (e) {
            expect(e.message).toEqual(`${address.address} is not in checksum format`)
        }
    }));
});
