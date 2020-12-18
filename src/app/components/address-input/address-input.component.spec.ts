import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    waitForAsync,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick,
} from '@angular/core/testing';
import { MatOption } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { MockConfig } from '../../../testing/mock-config';
import { AddressInputComponent } from './address-input.component';
import { AddressBookService } from '../../services/address-book.service';
import { Contact, Contacts } from '../../models/contact';
import {
    mockInput,
    mockMatSelectFirst,
    clickElement,
} from '../../../testing/interaction-helper';
import { TestProviders } from '../../../testing/test-providers';
import { of } from 'rxjs';
import {
    createAddress,
    createNetworkMock,
    createTestContacts,
} from '../../../testing/test-data';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { ReactiveFormsModule } from '@angular/forms';
import Spy = jasmine.Spy;

describe('AddressInputComponent', () => {
    let component: AddressInputComponent;
    let fixture: ComponentFixture<AddressInputComponent>;

    let mockConfig: MockConfig;
    let mockAddressBookService: AddressBookService;
    let input: HTMLInputElement;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AddressInputComponent],
                providers: [
                    TestProviders.MockRaidenConfigProvider(),
                    TestProviders.AddressBookStubProvider(),
                    {
                        provide: ErrorStateMatcher,
                        useClass: ShowOnDirtyErrorStateMatcher,
                    },
                    RaidenService,
                ],
                imports: [
                    MaterialComponentsModule,
                    HttpClientTestingModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                    ReactiveFormsModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressInputComponent);
        component = fixture.componentInstance;

        mockConfig = TestBed.inject(RaidenConfig) as MockConfig;
        mockAddressBookService = TestBed.inject(AddressBookService);
        const inputDebugElement = fixture.debugElement.query(By.css('input'));
        input = inputDebugElement.nativeElement as HTMLInputElement;
    });

    describe('as a simple address input', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.destroy();
        });

        it('should select an address', () => {
            const address = createAddress();
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            expect(input.value).toBe(address);
            expect(component.address).toBe(address);
            expect(component.errors).toBeFalsy();
        });

        it('should not display identicon container if displayIdenticon is false', () => {
            const address = createAddress();
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            const identiconElement = fixture.debugElement.query(
                By.css('.icon-box')
            );
            expect(identiconElement).toBeFalsy();
        });

        it('should display identicon container if displayIdenticon is true', () => {
            component.displayIdenticon = true;
            fixture.detectChanges();
            const address = createAddress();
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            const identiconElement = fixture.debugElement.query(
                By.css('.icon-box')
            );
            expect(identiconElement).toBeTruthy();
        });

        it('should not show an error without a user input', () => {
            const errorElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            expect(errorElement).toBeFalsy();
        });

        it('should show errors while the user types', () => {
            mockInput(fixture.debugElement, 'input', '0x');
            fixture.detectChanges();
            const errorElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            expect(errorElement).toBeTruthy();
        });

        it('should show error when address is not in checksum format', () => {
            const nonEip55Address =
                '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
            const eip55Address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            mockConfig.updateChecksumAddress(eip55Address);
            mockInput(fixture.debugElement, 'input', nonEip55Address);
            fixture.detectChanges();

            const errorElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            const errorMessage = errorElement.nativeElement.innerText.trim();
            expect(errorMessage).toBe(
                `The address is not in checksum format: ${eip55Address}`
            );
            expect(component.errors['notChecksumAddress']).toBe(true);
        });

        it('should be invalid but not show an error if the input is empty', () => {
            mockInput(fixture.debugElement, 'input', '');
            fixture.detectChanges();

            const errorElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            expect(errorElement).toBeFalsy();
            expect(component.errors['emptyAddress']).toBe(true);
        });

        it('should show an error if the address is not valid', () => {
            mockInput(fixture.debugElement, 'input', '0x');
            fixture.detectChanges();
            expect(component.errors['invalidFormat']).toBe(true);
        });

        it('should show an error if the address is own address', () => {
            const raidenService = TestBed.inject(RaidenService);
            const address = createAddress();
            spyOnProperty(
                raidenService,
                'raidenAddress',
                'get'
            ).and.returnValue(address);
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();
            expect(component.errors['ownAddress']).toBe(true);
        });

        it('should show an error if ENS resolve returns error', fakeAsync(() => {
            const raidenService = TestBed.inject(RaidenService);
            spyOn(raidenService, 'resolveEnsName').and.throwError(
                new Error('Could not resolve addess.')
            );

            mockInput(fixture.debugElement, 'input', 'test.eth');
            tick(2000);
            fixture.detectChanges();

            expect(component.errors['unableToResolveEns']).toBe('test.eth');
            flush();
        }));

        it('should display an error if ens is not supported', fakeAsync(() => {
            mockConfig.updateNetwork(
                createNetworkMock({ ensSupported: false })
            );

            mockInput(fixture.debugElement, 'input', 'test.eth');
            tick(2000);
            fixture.detectChanges();
            expect(component.errors['ensUnsupported']).toBe(true);

            flush();
        }));

        it('should display the address as a hint on successful ENS resolve', fakeAsync(() => {
            const address = createAddress();
            const raidenService = TestBed.inject(RaidenService);
            spyOn(raidenService, 'resolveEnsName').and.returnValue(of(address));

            mockInput(fixture.debugElement, 'input', 'test.eth');
            tick(2000);
            fixture.detectChanges();

            expect(input.value).toBe('test.eth');
            expect(component.address).toBe(address);
            expect(component.errors).toBeFalsy();
            const hintElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            const hintMessage = hintElement.nativeElement.innerText.trim();
            expect(hintMessage).toBe(`Resolved address: ${address}`);
            flush();
        }));
    });

    describe('as an autocomplete', () => {
        const contacts: Contact[] = createTestContacts(2);
        const contactsMap: Contacts = {};
        contacts.forEach((contact) => {
            contactsMap[contact.address] = contact.label;
        });

        beforeEach(() => {
            component.userAccount = true;
            mockAddressBookService.getObservableArray = () => of(contacts);
            mockAddressBookService.get = () => contactsMap;
            fixture.detectChanges();
        });

        it('should show all options with an empty input', () => {
            input.dispatchEvent(new Event('focusin'));
            input.click();
            fixture.detectChanges();

            const options = fixture.debugElement.queryAll(
                By.directive(MatOption)
            );
            expect(options.length).toBe(2);
        });

        it('should be able to select an option and show the label as a hint', () => {
            input.dispatchEvent(new Event('focusin'));
            input.click();
            fixture.detectChanges();

            mockMatSelectFirst(fixture.debugElement);
            fixture.detectChanges();

            expect(input.value).toBe(contacts[0].address);
            expect(component.address).toBe(contacts[0].address);
            expect(component.errors).toBeFalsy();
            const hintElement = fixture.debugElement.query(
                By.css('.info-box__text')
            );
            const hintMessage = hintElement.nativeElement.innerText.trim();
            expect(hintMessage).toBe(contacts[0].label);
        });

        it('should filter the results when the user types part of the label', () => {
            const contact2 = contacts[1];
            mockInput(
                fixture.debugElement,
                'input',
                contact2.label.substring(8, contact2.label.length)
            );
            fixture.detectChanges();

            const options = fixture.debugElement.queryAll(
                By.directive(MatOption)
            );
            expect(options.length).toBe(1);
            const visibleOption = options[0].componentInstance as MatOption;
            expect(visibleOption.value).toBe(contact2.address);
        });

        it('should filter the results when the user types part of the address', () => {
            const contact1 = contacts[0];
            mockInput(
                fixture.debugElement,
                'input',
                contact1.address.substring(0, 6)
            );
            fixture.detectChanges();

            const options = fixture.debugElement.queryAll(
                By.directive(MatOption)
            );
            expect(options.length).toBe(1);
            const visibleOption = options[0].componentInstance as MatOption;
            expect(visibleOption.value).toBe(contact1.address);
        });
    });

    describe('for adding a new contact', () => {
        let addressBookSpy: Spy;
        const address = createAddress();
        const label = 'Test contact';

        beforeEach(() => {
            const addressBookService = TestBed.inject(AddressBookService);
            addressBookSpy = spyOn(addressBookService, 'save');
            component.userAccount = true;
            fixture.detectChanges();
        });

        it('should be able to save a new address as contact', () => {
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            clickElement(fixture.debugElement, '#add-contact');
            fixture.detectChanges();

            mockInput(
                fixture.debugElement,
                'input[placeholder="Contact name"]',
                label
            );
            fixture.detectChanges();

            clickElement(fixture.debugElement, '#save-contact');
            fixture.detectChanges();

            expect(addressBookSpy).toHaveBeenCalledTimes(1);
            expect(addressBookSpy).toHaveBeenCalledWith({
                address,
                label,
            });
        });

        it('should save the contact on enter', () => {
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            clickElement(fixture.debugElement, '#add-contact');
            fixture.detectChanges();

            mockInput(
                fixture.debugElement,
                'input[placeholder="Contact name"]',
                label
            );
            fixture.detectChanges();

            const labelInput = fixture.debugElement.query(
                By.css('input[placeholder="Contact name"]')
            );
            labelInput.triggerEventHandler('keyup.enter', {
                stopPropagation: () => {},
            });
            fixture.detectChanges();

            expect(addressBookSpy).toHaveBeenCalledTimes(1);
            expect(addressBookSpy).toHaveBeenCalledWith({
                address,
                label,
            });
        });

        it('should not save the contact on enter if the label input is empty', () => {
            mockInput(fixture.debugElement, 'input', address);
            fixture.detectChanges();

            clickElement(fixture.debugElement, '#add-contact');
            fixture.detectChanges();

            mockInput(
                fixture.debugElement,
                'input[placeholder="Contact name"]',
                ''
            );
            fixture.detectChanges();

            const labelInput = fixture.debugElement.query(
                By.css('input[placeholder="Contact name"]')
            );
            labelInput.triggerEventHandler('keyup.enter', {
                stopPropagation: () => {},
            });
            fixture.detectChanges();

            expect(addressBookSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('as a programmatic input', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should set the value correctly and set no errors', () => {
            const address = createAddress();
            component.writeValue(address);
            fixture.detectChanges();

            expect(input.value).toBe(address);
            expect(component.address).toBe(address);
            expect(component.errors).toBeFalsy();
        });

        it('should set an error when the value is invalid', () => {
            component.writeValue('ABC');
            fixture.detectChanges();

            expect(input.value).toBe('ABC');
            expect(component.address).toBe('');
            expect(component.errors['invalidFormat']).toBe(true);
        });

        it('should should not to set a wrongly typed value', () => {
            component.writeValue(100);
            fixture.detectChanges();
            expect(input.value).toBe('');
            expect(component.address).toBe('');
            expect(component.errors).toBeTruthy();
        });
    });
});
