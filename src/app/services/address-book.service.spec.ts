import { inject, TestBed } from '@angular/core/testing';

import { AddressBookService } from './address-book.service';
import { Contact, Contacts } from '../models/contact';
import { LocalStorageAdapter } from '../adapters/local-storage-adapter';
import { storageMock } from '../../testing/mock-storage';

describe('AddressBookService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AddressBookService,
                {
                    provide: LocalStorageAdapter,
                    useFactory: () => {
                        const storage = storageMock();
                        return {
                            get localStorage(): Storage {
                                return storage;
                            }
                        };
                    }
                }
            ]
        });
    });

    it('should be created', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should be able to save and retrieve an address', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Mah Address',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            let contacts = service.get();
            expect(Object.keys(contacts).length).toBe(0);

            service.save(contact);

            contacts = service.get();
            expect(Object.keys(contacts).length).toBe(1);
            const firstKey = Object.keys(contacts)[0];
            expect(firstKey).toBe(contact.address);
            expect(contacts[firstKey]).toBe(contact.label);
        }
    ));

    it('should throw an error is the address is not an address', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Mah Address',
                address: '112231'
            };

            try {
                service.save(contact);
                fail('There should be an exception before');
            } catch (e) {
                expect(e.message).toEqual(
                    `${contact.address} is not an ethereum address`
                );
            }
        }
    ));

    it('should throw an error is the address is not in checksum format', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Mah Address',
                address: '0x504300c525cbe91adb3fe0944fe1f56f5162c75c'
            };

            try {
                service.save(contact);
                fail('There should be an exception before');
            } catch (e) {
                expect(e.message).toEqual(
                    `${contact.address} is not in checksum format`
                );
            }
        }
    ));

    it('should update the label if the same address is added a second time', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Mah Address',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            const addressUpdate: Contact = {
                label: 'Test Node',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            service.save(contact);

            let contacts = service.get();
            let keys = Object.keys(contacts);

            expect(keys.length).toBe(1);

            expect(keys[0]).toBe(
                contact.address,
                'The address was not equal to the original address'
            );
            expect(contacts[keys[0]]).toBe(contact.label);

            service.save(addressUpdate);

            contacts = service.get();
            keys = Object.keys(contacts);

            expect(keys.length).toBe(1);
            expect(keys[0]).toBe(
                addressUpdate.address,
                'The address was not equal to the updated address'
            );
            expect(contacts[keys[0]]).toBe(addressUpdate.label);
        }
    ));

    it('should delete the address from the list', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Test Node 1',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            const secondContact: Contact = {
                label: 'Test Node 2',
                address: '0x0E809A051034723beE67871a5A4968aE22d36C5A'
            };

            service.save(contact);
            service.save(secondContact);

            let contacts = service.get();

            expect(Object.keys(contacts).length).toBe(2);

            service.delete(contact);

            contacts = service.get();
            const keys = Object.keys(contacts);
            expect(keys.length).toBe(1);
            expect(keys[0]).toBe(
                secondContact.address,
                'The address was not equal to the updated address'
            );
            expect(contacts[keys[0]]).toBe(secondContact.label);
        }
    ));

    it('should delete all the addresses if deleteAll is called', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Test Node 1',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            const secondContact: Contact = {
                label: 'Test Node 2',
                address: '0x0E809A051034723beE67871a5A4968aE22d36C5A'
            };

            service.save(contact);
            service.save(secondContact);

            let contacts = service.get();

            expect(Object.keys(contacts).length).toBe(2);

            service.deleteAll();

            contacts = service.get();
            const keys = Object.keys(contacts);
            expect(keys.length).toBe(0);
        }
    ));

    it('should throw an exception when trying to restore invalid schema', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contacts: Contacts = {};

            // @ts-ignore
            contacts['randomKey'] = {};
            // @ts-ignore
            contacts['anotherRandomKey'] = [];

            try {
                service.store(contacts);
                fail('It should fail before reaching this point');
            } catch (e) {
                expect(e).toBeTruthy();
            }
        }
    ));

    it('should return the addresses as an array', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const contact: Contact = {
                label: 'Test Node 1',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            const secondContact: Contact = {
                label: 'Test Node 2',
                address: '0x0E809A051034723beE67871a5A4968aE22d36C5A'
            };

            service.save(contact);
            service.save(secondContact);

            const array = service.getArray();
            expect(array.length).toBe(2);
            expect(array).toContain(contact);
            expect(array).toContain(secondContact);
        }
    ));

    it('should create a that can be used for export', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const url = service.createExportURL();
            expect(url).toContain('blob:http://localhost');
        }
    ));

    it('should merge and override if merge is specified', inject(
        [AddressBookService],
        (service: AddressBookService) => {
            const first: Contact = {
                label: 'Test Node 1',
                address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
            };

            const second: Contact = {
                label: 'Test Node 2',
                address: '0x0E809A051034723beE67871a5A4968aE22d36C5A'
            };

            const third: Contact = {
                label: 'Test Node 3',
                address: '0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6'
            };

            service.save(first);
            service.save(second);

            expect(service.getArray()).toEqual([first, second]);

            const modified: Contact = {
                label: 'New Node Label',
                address: first.address
            };

            const imported: Contacts = {};
            imported[modified.address] = modified.label;
            imported[second.address] = second.label;
            imported[third.address] = third.label;

            service.store(imported, true);

            expect(service.getArray()).toEqual([modified, second, third]);
        }
    ));
});
