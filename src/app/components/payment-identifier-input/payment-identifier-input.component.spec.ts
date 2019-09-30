import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import { By } from '@angular/platform-browser';

import { PaymentIdentifierInputComponent } from './payment-identifier-input.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TestProviders } from '../../../testing/test-providers';
import {
    errorMessage,
    mockInput,
    mockFormInput
} from '../../../testing/interaction-helper';
import { BigNumberConversionDirective } from '../../directives/big-number-conversion.directive';
import BigNumber from 'bignumber.js';

describe('PaymentIdentifierInputComponent', () => {
    let component: PaymentIdentifierInputComponent;
    let fixture: ComponentFixture<PaymentIdentifierInputComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                PaymentIdentifierInputComponent,
                BigNumberConversionDirective
            ],
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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not be expanded by default', () => {
        expect(component.panel.expanded).toBe(false);
    });

    it('should default to no identifier', () => {
        component.panel.open();
        fixture.detectChanges();
        const inputDebugElement = fixture.debugElement.query(
            By.css('input[type=number]')
        );
        expect(inputDebugElement.nativeElement.value).toBe('');
    });

    it('should show the identifier input when panel is expanded', () => {
        component.panel.open();
        fixture.detectChanges();
        const inputDebugElement = fixture.debugElement.query(
            By.css('input[type=number]')
        );
        expect(inputDebugElement).toBeTruthy();
        expect(component.panel.expanded).toBe(true);
    });

    it('should not show an error without a user input', () => {
        component.panel.open();
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        component.panel.open();
        fixture.detectChanges();
        mockInput(fixture.debugElement, 'input[type=number]', 'Hello');
        fixture.detectChanges();
        expect(component.identifierFc.errors['notANumber']).toBe(true);
    });

    it('should show error when input is empty', () => {
        component.panel.open();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierFc', '');
        fixture.detectChanges();

        expect(component.identifierFc.errors['notANumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier is not a number'
        );
    });

    it('should show error when input is not a number', () => {
        component.panel.open();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierFc', '1Hello');
        fixture.detectChanges();

        expect(component.identifierFc.errors['notANumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier is not a number'
        );
    });

    it('should show error when input value is less than 0', () => {
        component.panel.open();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierFc', '-1');
        fixture.detectChanges();

        expect(component.identifierFc.errors['invalidNumber']).toBe(true);
        expect(errorMessage(fixture.debugElement)).toBe(
            'The payment identifier should be a positive number'
        );
    });

    it('should be able to reset the expansion panel', () => {
        component.panel.open();
        fixture.detectChanges();
        component.resetPanel();
        fixture.detectChanges();

        expect(component.panel.expanded).toBe(false);
    });

    it('should reset the input when expansion panel is closed', () => {
        component.panel.open();
        fixture.detectChanges();
        mockFormInput(fixture.debugElement, 'identifierFc', '999');
        fixture.detectChanges();

        component.panel.close();
        fixture.detectChanges();
        component.panel.open();
        fixture.detectChanges();

        const inputDebugElement = fixture.debugElement.query(
            By.css('input[type=number]')
        );
        expect(inputDebugElement.nativeElement.value).toBe('');
        expect(component.identifierFc.value).toBe(null);
    });
});
