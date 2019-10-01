import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

import { TokenInputComponent } from './token-input.component';
import { TestProviders } from '../../../testing/test-providers';
import { mockInput, errorMessage } from '../../../testing/interaction-helper';
import { BigNumberConversionDirective } from '../../directives/big-number-conversion.directive';

describe('TokenInputComponent', () => {
    let component: TokenInputComponent;
    let fixture: ComponentFixture<TokenInputComponent>;

    let input: HTMLInputElement;
    let checkbox: HTMLInputElement;

    function mockFormInput(inputValue: string, isStep: boolean = false) {
        input.value = inputValue;
        const event = new Event('input');
        if (!isStep) {
            Object.assign(event, { inputType: 'mock' });
        }

        input.dispatchEvent(event);
        component.form.get('amount').markAsTouched();
    }

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenInputComponent, BigNumberConversionDirective],
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
        fixture = TestBed.createComponent(TokenInputComponent);
        component = fixture.componentInstance;
        component.placeholder = 'Amount';
        component.errorPlaceholder = 'amount';
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

    it('should have decimal input active by default', () => {
        expect(checkbox.checked).toBe(true);
    });

    it('should default to 0 amount', () => {
        expect(input.value).toBe('0');
    });

    it('should have decimal step when checkbox is not selected', () => {
        component.decimals = 18;
        expect(component.step()).toBe('0.000000000000000001');
    });

    it('should have integer step when checkbox not checked', async(() => {
        component.decimals = 18;
        component.form.get('decimals').setValue(false);
        fixture.detectChanges();

        expect(component.step()).toBe('1');
    }));

    it('should have allow an integer amount if checkbox not selected', () => {
        component.decimals = 18;
        component.form.get('decimals').setValue(false);

        mockFormInput('10');

        fixture.detectChanges();
        expect(component.form.get('amount').value.isEqualTo(10)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(0);
    });

    it('should allow a decimal amount if checkbox is selected', () => {
        component.decimals = 18;

        mockFormInput('0.000000000000000010');

        fixture.detectChanges();
        expect(input.value).toBe('0.000000000000000010');
        expect(component.form.get('amount').value.isEqualTo(10)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(18);
    });

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        mockInput(fixture.debugElement, 'input[type=number]', '0.1');
        fixture.detectChanges();
        expect(component.form.get('amount').errors['tooManyDecimals']).toBe(
            true
        );
    });

    it('should show error when input is empty', () => {
        component.decimals = 18;

        mockFormInput('');
        fixture.detectChanges();

        expect(component.form.get('amount').value.isNaN()).toBe(true);
        expect(component.tokenAmountDecimals).toBe(18);
        expect(component.form.get('amount').errors['notANumber']).toBe(true);
    });

    it('should show error when input is not a number', () => {
        component.decimals = 18;

        mockFormInput('1Hello');
        fixture.detectChanges();

        expect(component.form.get('amount').value.isNaN()).toBe(true);
        expect(component.tokenAmountDecimals).toBe(18);
        expect(component.form.get('amount').errors['notANumber']).toBe(true);
    });

    it('should show error when input value is 0', () => {
        component.decimals = 18;

        mockFormInput('0');
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(0)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(18);
        expect(component.form.get('amount').errors['invalidAmount']).toBe(true);
    });

    it('should show no error when input value is 0 and zero is allowed', () => {
        component.decimals = 18;
        component.allowZero = true;

        mockFormInput('0');
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(0)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(18);
        expect(component.form.get('amount').errors).toBeNull();
    });

    it('should automatically change the value integer value on checkbox change', () => {
        component.decimals = 8;

        mockFormInput('0.00000001');
        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(1)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(0);
    });

    it('should automatically change to the decimal value on checkbox change', () => {
        component.form.get('decimals').setValue(false);
        component.decimals = 8;
        fixture.detectChanges();

        mockFormInput('1');

        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(1)).toBe(true);
        expect(input.value).toBe('0.00000001');
        expect(component.tokenAmountDecimals).toBe(8);
    });

    it('should change the value to 0 for invalid inputs on checkbox change', () => {
        component.decimals = 8;

        mockFormInput('1Hello');

        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(0)).toBe(true);
        expect(input.value).toBe('0');
        expect(component.tokenAmountDecimals).toBe(0);
    });

    it('should change the value to 0 for inputs with too many decimals on checkbox change', () => {
        component.decimals = 8;

        mockFormInput('0.000000001');

        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(0)).toBe(true);
        expect(input.value).toBe('0');
        expect(component.tokenAmountDecimals).toBe(0);
    });

    it('should automatically convert between decimal and integer', () => {
        component.form.get('decimals').setValue(false);
        component.decimals = 8;
        fixture.detectChanges();

        mockFormInput('1');

        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(1)).toBe(true);
        expect(input.value).toBe('0.00000001');
        expect(component.tokenAmountDecimals).toBe(8);

        checkbox.click();
        fixture.detectChanges();

        expect(component.form.get('amount').value.isEqualTo(1)).toBe(true);
        expect(input.value).toBe('1');
        expect(component.tokenAmountDecimals).toBe(0);
    });

    it('should be able to reset the amount', () => {
        mockFormInput('1');
        fixture.detectChanges();
        component.resetAmount();
        expect(component.form.get('amount').value.isEqualTo(0)).toBe(true);
        expect(component.tokenAmountDecimals).toBe(0);
    });
});
