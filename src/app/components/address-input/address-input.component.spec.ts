import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIcon, MatOption } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { SharedService } from '../../services/shared.service';
import { MockConfig } from '../../../testing/mock-config';

import { AddressInputComponent } from './address-input.component';
import { AddressBookService } from '../../services/address-book.service';
import { Address } from '../../models/address';
import { errorMessage, mockInput } from '../../../testing/interaction-helper';

// @ts-ignore
import * as Web3 from 'web3';
import { TestProviders } from '../../../testing/test-providers';

describe('AddressInputComponent', () => {
    let component: AddressInputComponent;
    let fixture: ComponentFixture<AddressInputComponent>;
    let mockAddressBookService: AddressBookService;


    const nonEip55Address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
    let mockConfig: MockConfig;

    beforeEach(async(() => {

        TestBed.configureTestingModule({
            declarations: [
                AddressInputComponent
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                SharedService
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();

        const config = TestBed.get(RaidenConfig) as MockConfig;
        config.web3 = new Web3();

        mockAddressBookService = TestBed.get(AddressBookService);
    }));

    beforeEach(() => {
        mockConfig = TestBed.get(RaidenConfig);
        fixture = TestBed.createComponent(AddressInputComponent);
        component = fixture.componentInstance;
        component.placeholder = 'Token Address';
        component.errorPlaceholder = 'Token network';
    });

    describe('as a simple address input', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should not display identicon container if displayIdenticon is false', () => {
            component.displayIdenticon = false;

            fixture.detectChanges();
            const identiconElement = fixture.debugElement.query(By.css('.identicon'));
            expect(identiconElement).toBeFalsy();
        });

        it('should display identicon container if displayIdenticon is true', () => {
            component.displayIdenticon = true;
            fixture.detectChanges();
            const identiconPlaceholder = fixture.debugElement.query(By.directive(MatIcon));
            expect(identiconPlaceholder).toBeTruthy();
        });

        it('should show error when address is not in checksum format', () => {
            component.displayIdenticon = true;
            mockConfig.updateChecksumAddress('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
            fixture.detectChanges();

            component.addressFc.markAsTouched();
            mockInput(fixture.debugElement, 'input[type=text]', nonEip55Address);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement))
                .toBe('Address is not in checksum format: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
        });

        it('should show an error if the input is empty', () => {
            component.addressFc.markAsTouched();
            mockInput(fixture.debugElement, 'input[type=text]', '');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(`${component.errorPlaceholder} address cannot be empty`);
        });

        it('should show an error if the error is not 42 characters long', () => {
            component.addressFc.markAsTouched();
            mockInput(fixture.debugElement, 'input[type=text]', '0x');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(`Invalid ${component.errorPlaceholder} address length`);
        });

        it('should show an error if the address is not valid', () => {
            component.addressFc.markAsTouched();
            mockInput(fixture.debugElement, 'input[type=text]', 'abbfosdaiudaisduaosiduaoisduaoisdu23423423');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(`The ${component.errorPlaceholder} address is not in a valid format`);
        });

        it('should show an error if the address is own address', () => {
            mockConfig.setIsChecksum(true);

            const service = TestBed.get(RaidenService);
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            spyOnProperty(service, 'raidenAddress', 'get').and.returnValue(address);
            component.addressFc.markAsTouched();
            mockInput(fixture.debugElement, 'input[type=text]', address);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(`You cannot use your own address for this action`);
        });

        it('should update form control value properly if a truthy value is passed', () => {
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            component.writeValue(address);
            expect(component.addressFc.value).toBe(address);
        });

        it('should not update form control when a falsy value is passed', () => {
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            component.writeValue(address);
            component.writeValue(null);
            expect(component.addressFc.value).toBe(address);
        });

        it('should disable the input if the component is disabled', function () {
            expect(component.addressFc.disabled).toBe(false);
            component.setDisabledState(true);
            fixture.detectChanges();
            expect(component.addressFc.disabled).toBe(true);
        });

        it('should have any filteredOptions if not in userAccount mode', function () {
            expect(component.filteredOptions$).toBeUndefined();
        });

        it('should be return empty on validation', function () {
            expect(component.validate(component.addressFc)).toEqual({empty: true});
        });

        it('should return validation errors on invalid value', function () {
            component.addressFc.setValue('Testing Account 2');
            expect(component.validate(component.addressFc)).toEqual({
                minlength: {requiredLength: 42, actualLength: 17},
                pattern: {requiredPattern: '^0x[0-9a-fA-F]{40}$', actualValue: 'Testing Account 2'}
            });
        });

        it('should call on touched when internal input value changes', function () {
            const spyObj = jasmine.createSpyObj('spy', ['done']);
            component.registerOnTouched(spyObj.done);
            component.addressFc.setValue('12231');
            expect(spyObj.done).toHaveBeenCalledTimes(1);
            component.registerOnTouched(undefined);
        });

        it('should call onChange function when internal input value changes', function () {
            const spyObj = jasmine.createSpyObj('spy', ['done']);
            component.registerOnChange(spyObj.done);
            component.addressFc.setValue('12231');
            expect(spyObj.done).toHaveBeenCalledTimes(1);
            expect(spyObj.done.calls.first().args[0]).toBe('12231');
            component.registerOnChange(undefined);
        });

        it('should display an identicon when a valid address is inserted', async function () {
            component.displayIdenticon = true;
            component.addressFc.setValue('0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6');
            fixture.detectChanges();
            expect(component.addressFc.valid).toBe(true, component.addressFc.errors);
            await fixture.whenStable();
            expect(fixture.debugElement.query(By.directive(MatIcon))).toBeNull();
            expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();
        });
    });

    describe('as an autocomplete', () => {

        const addresses: Address[] = [{
            address: '0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6',
            label: 'Testing Account 1'
        }, {
            address: '0x88DBDdF47Fe2d8aa2b540b2FF1D83972AF60D41d',
            label: 'Testing Account 2'
        }];

        beforeEach(async () => {
            component.userAccount = true;
            mockAddressBookService.getArray = () => addresses;
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should filter the results when the user types part of the label', async () => {
            mockInput(fixture.debugElement, 'input[type=text]', 'Account 2');
            component.addressFc.setValue('Account 2');
            component.addressFc.markAsTouched();
            component.addressFc.markAsDirty();
            fixture.detectChanges();

            await fixture.whenStable();
            const options = fixture.debugElement.queryAll(By.directive(MatOption));
            expect(options.length).toBe(1);
            const visibleOption = options[0].componentInstance as MatOption;
            expect(visibleOption.value).toBe(addresses[1].address, 'Second account should be visible');
        });

        it('should filter the results when the users types part of the address', async function () {
            mockInput(fixture.debugElement, 'input[type=text]', '53A9462');
            component.addressFc.setValue('53A9462');
            component.addressFc.markAsTouched();
            component.addressFc.markAsDirty();
            fixture.detectChanges();

            await fixture.whenStable();
            const options = fixture.debugElement.queryAll(By.directive(MatOption));
            expect(options.length).toBe(1);
            const option = options[0];
            const visibleOption = option.componentInstance as MatOption;
            const firstAddress = addresses[0];
            expect(visibleOption.value).toBe(firstAddress.address, 'First account should be visible');
            option.nativeElement.click();
            expect(component.addressFc.value).toBe(firstAddress.address);
        });
    });
});
