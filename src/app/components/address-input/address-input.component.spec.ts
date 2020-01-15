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
import { MatOption } from '@angular/material/core';
import { MatHint } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { MockConfig } from '../../../testing/mock-config';

import { AddressInputComponent } from './address-input.component';
import { AddressBookService } from '../../services/address-book.service';
import { Contact } from '../../models/contact';
import {
    errorMessage,
    mockFormInput,
    mockInput
} from '../../../testing/interaction-helper';

import { TestProviders } from '../../../testing/test-providers';
import { Component, DebugElement } from '@angular/core';
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
    let input: DebugElement;

    const nonEip55Address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359';
    let mockConfig: MockConfig;

    const formBuilder: FormBuilder = new FormBuilder();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddressInputComponent, TestHostComponent],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.HammerJSProvider(),
                { provide: FormBuilder, useValue: formBuilder },
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
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
        input = fixture.debugElement.query(By.directive(AddressInputComponent));
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

        it('should not show an error without a user input', () => {
            expect(errorMessage(fixture.debugElement)).toBeFalsy();
        });

        it('should show errors while the user types', () => {
            mockInput(fixture.debugElement, 'input', '0x');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `The ${
                    component.errorPlaceholder
                } address is not in a valid format`
            );
        });

        it('should show error when address is not in checksum format', fakeAsync(() => {
            component.displayIdenticon = true;
            mockConfig.updateChecksumAddress(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );

            mockFormInput(input, 'inputFieldFc', nonEip55Address);

            tick(2000);

            fixture.detectChanges();

            expect(errorMessage(fixture.debugElement)).toBe(
                'Address is not in checksum format: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
        }));

        it('should show an error if the input is empty', fakeAsync(() => {
            mockFormInput(input, 'inputFieldFc', '');
            fixture.detectChanges();
            tick();
            expect(errorMessage(fixture.debugElement)).toBe(
                `${component.errorPlaceholder} address cannot be empty`
            );
        }));

        it('should show an error if not a valid address', () => {
            mockFormInput(input, 'inputFieldFc', '0x');
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `The ${
                    component.errorPlaceholder
                } address is not in a valid format`
            );
        });

        it('should show an error if the address is not valid', fakeAsync(() => {
            mockFormInput(
                input,
                'inputFieldFc',
                'abbfosdaiudaisduaosiduaoisduaoisdu23423423'
            );
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
            mockFormInput(input, 'inputFieldFc', address);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                `You cannot use your own address for this action`
            );
        });

        it('should update form control value properly if a truthy value is passed', () => {
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            mockFormInput(input, 'inputFieldFc', address);
            expect(component.value).toBe(address);
        });

        it('should display an identicon when a valid address is inserted', async function() {
            component.displayIdenticon = true;
            mockFormInput(
                input,
                'inputFieldFc',
                '0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6'
            );
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

            mockFormInput(input, 'inputFieldFc', 'test.eth');
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

            mockFormInput(input, 'inputFieldFc', 'test.eth');
            tick(2000);
            fixture.detectChanges();
            const hint = fixture.debugElement.query(By.directive(MatHint));
            expect(hint.nativeElement.innerText).toBe(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
            flush();
        }));

        it('should display an error if ens is not supported', fakeAsync(() => {
            mockConfig.updateNetwork({
                name: 'Test',
                shortName: 'tst',
                ensSupported: false,
                chainId: 9001
            });

            mockFormInput(input, 'inputFieldFc', 'test.eth');
            tick(2000);
            fixture.detectChanges();
            expect(errorMessage(fixture.debugElement)).toBe(
                'Test network is unsupported for ENS resolution'
            );
            flush();
        }));
    });

    describe('as an autocomplete', () => {
        const addresses: Contact[] = [
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
            mockFormInput(input, 'inputFieldFc', 'Account 2');
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
            mockFormInput(input, 'inputFieldFc', '53A9462');
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

    describe('as a programmatic input', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should set the value correctly and set no errors', () => {
            const instance = input.componentInstance;
            instance.writeValue('0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6');
            expect(instance.address).toBe(
                '0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6'
            );
            expect(instance.validate(instance.inputFieldFc)).toBeFalsy();
        });

        it('should set an error when the input value is invalid', () => {
            const instance = input.componentInstance;
            instance.writeValue('ABC');
            expect(instance.address).toBe('');
            expect(
                instance.validate(instance.inputFieldFc).invalidFormat
            ).toBeTruthy();
        });

        it('should set an error when the input value is not in checksum format', () => {
            mockConfig.updateChecksumAddress(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
            const instance = input.componentInstance;
            instance.writeValue(nonEip55Address);
            expect(instance.address).toBe('');
            expect(
                instance.validate(instance.inputFieldFc).notChecksumAddress
            ).toBeTruthy();
        });

        it('should set an error when the input value is own address', () => {
            const instance = input.componentInstance;
            const service = TestBed.get(RaidenService);
            const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
            spyOnProperty(service, 'raidenAddress', 'get').and.returnValue(
                address
            );
            instance.writeValue(address);
            expect(instance.address).toBe('');
            expect(
                instance.validate(instance.inputFieldFc).ownAddress
            ).toBeTruthy();
        });

        it('should reset the value when a falsy value is passed', () => {
            const instance = input.componentInstance;
            instance.writeValue('0x53A9462Be18D8f74C1065Be65A58D5A41347e0A6');
            instance.writeValue('');
            expect(instance.address).toBe('');
            expect(
                instance.validate(instance.inputFieldFc).emptyAddress
            ).toBeTruthy();
        });
    });
});
