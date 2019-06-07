import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    async,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick
} from '@angular/core/testing';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { MatHint, MatIcon, MatOption } from '@angular/material';
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

import { TestProviders } from '../../../testing/test-providers';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

// noinspection Angular2DeclarationMembershipInModule
@Component({
    template: `
        <form [formGroup]="form">
            <app-address-input
                formControlName="address"
                [placeholder]="placeholder"
                [errorPlaceholder]="errorPlaceholder"
                [displayIdenticon]="displayIdenticon"
                [userAccount]="userAccount"
            >
            </app-address-input>
        </form>
    `
})
class TestHostComponent {
    displayIdenticon = false;
    userAccount = false;
    placeholder = 'Token Address';
    errorPlaceholder = 'Token network';

    readonly form: FormGroup = this.fb.group({
        address: ''
    });

    get value(): string {
        return this.control.value;
    }

    get control(): AbstractControl {
        return this.form.get('address');
    }

    constructor(private fb: FormBuilder) {}
}

describe('AddressInputComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let mockAddressBookService: AddressBookService;

    const nonEip55Address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
    let mockConfig: MockConfig;

    function input(val: string) {
        const addressInput = fixture.debugElement.query(
            By.directive(AddressInputComponent)
        );
        const instance = addressInput.componentInstance as AddressInputComponent;
        const inputElement = mockInput(fixture.debugElement, 'input', val);
        instance.inputFieldFc.setValue(val);
        instance.inputFieldFc.markAsDirty();
        instance.inputFieldFc.markAsTouched();
        return inputElement;
    }

    const formBuilder: FormBuilder = new FormBuilder();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddressInputComponent, TestHostComponent],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.HammerJSProvider(),
                SharedService,
                { provide: FormBuilder, useValue: formBuilder }
            ],
            imports: [
                CommonModule,
                MaterialComponentsModule,
                ReactiveFormsModule,
                FormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();

        mockAddressBookService = TestBed.get(AddressBookService);
    }));

    beforeEach(() => {
        mockConfig = TestBed.get(RaidenConfig);
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
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
            const identiconElement = fixture.debugElement.query(
                By.css('.identicon')
            );
            expect(identiconElement).toBeFalsy();
        });

        it('should display identicon container if displayIdenticon is true', () => {
            component.displayIdenticon = true;
            fixture.detectChanges();
            const identiconPlaceholder = fixture.debugElement.query(
                By.directive(MatIcon)
            );
            expect(identiconPlaceholder).toBeTruthy();
        });

        it('should show error when address is not in checksum format', fakeAsync(() => {
            component.displayIdenticon = true;
            mockConfig.updateChecksumAddress(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );

            input(nonEip55Address);

            tick(2000);

            fixture.detectChanges();

            expect(errorMessage(fixture.debugElement)).toBe(
                'Address is not in checksum format: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
        }));

        it('should show an error if the input is empty', fakeAsync(() => {
            input('');
            fixture.detectChanges();
            tick();
            expect(errorMessage(fixture.debugElement)).toBe(
                `${component.errorPlaceholder} address cannot be empty`
            );
        }));

        it('should show an error if not a valid address', () => {
            input('0x');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `The ${
                    component.errorPlaceholder
                } address is not in a valid format`
            );
        });

        it('should show an error if the address is not valid', fakeAsync(() => {
            input('abbfosdaiudaisduaosiduaoisduaoisdu23423423');
            tick(2000);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `The ${
                    component.errorPlaceholder
                } address is not in a valid format`
            );
            flush();
        }));

        it('should show an error if the address is own address', () => {
            mockConfig.setIsChecksum(true);

            const service = TestBed.get(RaidenService);
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            spyOnProperty(service, 'raidenAddress', 'get').and.returnValue(
                address
            );
            input(address);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `You cannot use your own address for this action`
            );
        });

        it('should update form control value properly if a truthy value is passed', () => {
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            input(address);
            expect(component.value).toBe(address);
        });

        it('should display an identicon when a valid address is inserted', async function() {
            component.displayIdenticon = true;
            input('0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6');
            fixture.detectChanges();
            expect(component.control.valid).toBe(true);
            await fixture.whenStable();
            expect(
                fixture.debugElement.query(By.directive(MatIcon))
            ).toBeNull();
            expect(fixture.debugElement.query(By.css('img'))).toBeTruthy();
        });

        it('should display an error if ens resolve returns null', fakeAsync(() => {
            const service = TestBed.get(RaidenService);
            spyOn(service, 'resolveEnsName').and.returnValue(of(null));

            input('test.eth');
            tick(2000);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                'Could not resolve the address for test.eth'
            );
            flush();
        }));

        it('should display the address as a hint on successful resolve', fakeAsync(() => {
            const service = TestBed.get(RaidenService);
            spyOn(service, 'resolveEnsName').and.returnValue(
                of('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359')
            );

            input('test.eth');
            tick(2000);
            fixture.detectChanges();
            const hint = fixture.debugElement.query(By.directive(MatHint));
            expect(hint.nativeElement.innerText).toBe(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
            flush();
        }));
    });

    describe('as an autocomplete', () => {
        const addresses: Address[] = [
            {
                address: '0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6',
                label: 'Testing Account 1'
            },
            {
                address: '0x88DBDdF47Fe2d8aa2b540b2FF1D83972AF60D41d',
                label: 'Testing Account 2'
            }
        ];

        beforeEach(async () => {
            component.userAccount = true;
            mockAddressBookService.getArray = () => addresses;
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should filter the results when the user types part of the label', async () => {
            input('Account 2');
            fixture.detectChanges();

            await fixture.whenStable();
            const options = fixture.debugElement.queryAll(
                By.directive(MatOption)
            );
            expect(options.length).toBe(1);
            const visibleOption = options[0].componentInstance as MatOption;
            expect(visibleOption.value).toBe(
                addresses[1].address,
                'Second account should be visible'
            );
        });

        it('should filter the results when the users types part of the address', async () => {
            input('53A9462');
            fixture.detectChanges();

            await fixture.whenStable();
            const options = fixture.debugElement.queryAll(
                By.directive(MatOption)
            );
            expect(options.length).toBe(1);
            const option = options[0];
            const visibleOption = option.componentInstance as MatOption;
            const firstAddress = addresses[0];
            expect(visibleOption.value).toBe(
                firstAddress.address,
                'First account should be visible'
            );
            option.nativeElement.click();
            expect(component.value).toBe(firstAddress.address);
        });
    });
});
