import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { SharedService } from '../../services/shared.service';
import { MockConfig } from '../../../testing/mock-config';

import { AddressInputComponent } from './address-input.component';
import { AddressBookService } from '../../services/address-book.service';
import { errorMessage, mockInput } from '../../../testing/interaction-helper';
import Spy = jasmine.Spy;

describe('AddressInputComponent', () => {
    let component: AddressInputComponent;
    let fixture: ComponentFixture<AddressInputComponent>;
    let mockAddressBookService: AddressBookService;
    let getArraySpy: Spy;

    const nonEip55Address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
    let mockConfig: MockConfig;

    beforeEach(async(() => {
        mockAddressBookService = jasmine.createSpyObj('AddressBookService', ['getArray']);
        getArraySpy = (mockAddressBookService.getArray as Spy);
        getArraySpy.and.returnValue([]);

        TestBed.configureTestingModule({
            declarations: [
                AddressInputComponent
            ],
            providers: [
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                },
                {
                    provide: AddressBookService,
                    useFactory: () => mockAddressBookService
                },
                SharedService
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
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

        it('should update formcontrol value properly if a truthy value is passed', () => {
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
    });

});
