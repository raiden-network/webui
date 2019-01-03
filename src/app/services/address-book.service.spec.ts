import { inject, TestBed } from '@angular/core/testing';

import { AddressBookService } from './address-book.service';
import { Address } from "../models/address";
import { LocalStorageAdapter } from "../adapters/local-storage-adapter";
import { storageMock } from "../../testing/mock-storage";

describe('AddressBookService', () => {

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

        let addresses = service.get();
        expect(Object.keys(addresses).length).toBe(0);

        service.save(address);

        addresses = service.get();
        expect(Object.keys(addresses).length).toBe(1);
        let firstKey = Object.keys(addresses)[0];
        expect(firstKey).toBe(address.address);
        expect(addresses[firstKey]).toBe(address.label)
    }));

    it('should throw an error is the address is not an address', inject([AddressBookService], (service: AddressBookService) => {
        const address: Address = {
            label: "Mah Address",
            address: "112231"
        };

        try {
            service.save(address);
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
            service.save(address);
            fail('There should be an exception before')
        } catch (e) {
            expect(e.message).toEqual(`${address.address} is not in checksum format`)
        }
    }));

    it('should update the label if the same address is added a second time', inject([AddressBookService], (service: AddressBookService) => {
        const address: Address = {
            label: "Mah Address",
            address: "0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C"
        };

        const addressUpdate: Address = {
            label: "Test Node",
            address: "0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C"
        };

        service.save(address);

        let addresses = service.get();
        let keys = Object.keys(addresses);

        expect(keys.length).toBe(1);

        expect(keys[0]).toBe(address.address, "The address was not equal to the original address");
        expect(addresses[keys[0]]).toBe(address.label);

        service.save(addressUpdate);

        addresses = service.get();
        keys = Object.keys(addresses);

        expect(keys.length).toBe(1);
        expect(keys[0]).toBe(addressUpdate.address, "The address was not equal to the updated address");
        expect(addresses[keys[0]]).toBe(addressUpdate.label)
    }));

    it('should delete the address from the list', inject([AddressBookService], (service: AddressBookService) => {
        const address: Address = {
            label: "Test Node 1",
            address: "0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C"
        };

        const secondAddress: Address = {
            label: "Test Node 2",
            address: "0x0E809A051034723beE67871a5A4968aE22d36C5A"
        };

        service.save(address);
        service.save(secondAddress);

        let addresses = service.get();

        expect(Object.keys(addresses).length).toBe(2);

        service.delete(address);

        addresses = service.get();
        let keys = Object.keys(addresses);
        expect(keys.length).toBe(1);
        expect(keys[0]).toBe(secondAddress.address, "The address was not equal to the updated address");
        expect(addresses[keys[0]]).toBe(secondAddress.label);
    }));

});
