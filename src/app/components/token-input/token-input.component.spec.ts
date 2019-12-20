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

    function mockFormInput(inputValue: string, isStep: boolean = false) {
        input.value = inputValue;
        const event = new Event('input');
        if (!isStep) {
            Object.assign(event, { inputType: 'mock' });
        }

        input.dispatchEvent(event);
        component.inputControl.markAsTouched();
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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should default to 0 amount', () => {
        expect(input.value).toBe('0');
    });

    it('should have decimal step', () => {
        component.decimals = 18;
        expect(component.minimumAmount()).toBe('0.000000000000000001');
    });

    it('should allow a decimal amount', () => {
        component.decimals = 18;

        mockFormInput('0.000000000000000010');

        fixture.detectChanges();
        expect(input.value).toBe('0.000000000000000010');
        expect(component.inputControl.value.isEqualTo(10)).toBe(true);
    });

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        mockInput(fixture.debugElement, 'input[type=number]', '0.1');
        fixture.detectChanges();
        expect(component.inputControl.errors['tooManyDecimals']).toBe(true);
    });

    it('should show error when input is empty', () => {
        component.decimals = 18;

        mockFormInput('');
        fixture.detectChanges();

        expect(component.inputControl.value.isNaN()).toBe(true);
        expect(component.inputControl.errors['notANumber']).toBe(true);
    });

    it('should show error when input is not a number', () => {
        component.decimals = 18;

        mockFormInput('1Hello');
        fixture.detectChanges();

        expect(component.inputControl.value.isNaN()).toBe(true);
        expect(component.inputControl.errors['notANumber']).toBe(true);
    });

    it('should show error when input value is 0', () => {
        component.decimals = 18;

        mockFormInput('0');
        fixture.detectChanges();

        expect(component.inputControl.value.isEqualTo(0)).toBe(true);
        expect(component.inputControl.errors['invalidAmount']).toBe(true);
    });

    it('should show no error when input value is 0 and zero is allowed', () => {
        component.decimals = 18;
        component.allowZero = true;

        mockFormInput('0');
        fixture.detectChanges();

        expect(component.inputControl.value.isEqualTo(0)).toBe(true);
        expect(component.inputControl.errors).toBeNull();
    });

    it('should be able to reset the amount', () => {
        mockFormInput('1');
        fixture.detectChanges();
        component.resetAmount();
        expect(component.inputControl.value.isEqualTo(0)).toBe(true);
    });

    it('should clear input field on focus', () => {
        expect(component.inputControl.value.isEqualTo(0)).toBe(true);
        input.dispatchEvent(new Event('focus'));
        expect(component.inputControl.value).toBe('');
    });

    it('should not clear input field a second time on focus', () => {
        input.dispatchEvent(new Event('focus'));
        mockFormInput('1');
        input.dispatchEvent(new Event('focus'));
        expect(component.inputControl.value.isEqualTo(1)).toBe(true);
    });
});
