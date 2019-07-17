import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material';
import { By } from '@angular/platform-browser';

import { PaymentIdentifierInputComponent } from './payment-identifier-input.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TestProviders } from '../../../testing/test-providers';
import {
    errorMessage,
    mockInput,
    mockFormInput
} from '../../../testing/interaction-helper';

describe('PaymentIdentifierInputComponent', () => {
    let component: PaymentIdentifierInputComponent;
    let fixture: ComponentFixture<PaymentIdentifierInputComponent>;

    let input: HTMLInputElement;
    let checkbox: HTMLInputElement;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PaymentIdentifierInputComponent],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentIdentifierInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const inputDebugElement = fixture.debugElement.query(
            By.css('input[type=number]')
        );
        input = inputDebugElement.nativeElement as HTMLInputElement;

        const checkboxElement = fixture.debugElement.query(
            By.css('input[type=checkbox]')
        );
        checkbox = checkboxElement.nativeElement as HTMLInputElement;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not be editable by default', () => {
        expect(checkbox.checked).toBe(false);
        expect(input.disabled).toBe(true);
        expect(checkbox.disabled).toBe(false);
        expect(component.checkboxControl.disabled).toBe(false);
        expect(component.identifierControl.disabled).toBe(true);
    });

    it('should default to 0 amount', () => {
        expect(input.value).toBe('0');
    });

    it('should enable the identifier input when the checkbox is clicked', () => {
        checkbox.click();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(true);
        expect(input.disabled).toBe(false);
        expect(checkbox.disabled).toBe(true);
        expect(component.checkboxControl.disabled).toBe(true);
        expect(component.identifierControl.disabled).toBe(false);
    });

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        checkbox.click();
        fixture.detectChanges();
        mockInput(fixture.debugElement, 'input[type=number]', 'Hello');
        fixture.detectChanges();
        expect(component.identifierControl.errors['notANumber']).toBe(true);
    });

    it('should show error when input is empty', () => {
        checkbox.click();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierControl', '');
        fixture.detectChanges();

        expect(component.identifierControl.errors['notANumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier is not a number'
        );
    });

    it('should show error when input is not a number', () => {
        checkbox.click();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierControl', '1Hello');
        fixture.detectChanges();

        expect(component.identifierControl.errors['notANumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier is not a number'
        );
    });

    it('should show error when input value is less than 0', () => {
        checkbox.click();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierControl', '-1');
        fixture.detectChanges();

        expect(component.identifierControl.errors['invalidNumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier should be a positive number'
        );
    });

    it('should be able to reset the editability of the input', () => {
        checkbox.click();
        fixture.detectChanges();

        component.resetEditability();
        fixture.detectChanges();
        expect(checkbox.checked).toBe(false);
        expect(input.disabled).toBe(true);
        expect(checkbox.disabled).toBe(false);
        expect(component.checkboxControl.disabled).toBe(false);
        expect(component.identifierControl.disabled).toBe(true);
    });
});
