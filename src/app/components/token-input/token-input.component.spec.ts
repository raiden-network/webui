import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import { TokenInputComponent } from './token-input.component';
import { TestProviders } from '../../../testing/test-providers';
import { mockInput } from '../../../testing/interaction-helper';
import { createToken } from '../../../testing/test-data';

describe('TokenInputComponent', () => {
    let component: TokenInputComponent;
    let fixture: ComponentFixture<TokenInputComponent>;

    let input: HTMLInputElement;
    const token = createToken();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenInputComponent],
            providers: [
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher,
                },
            ],
            imports: [MaterialComponentsModule, NoopAnimationsModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenInputComponent);
        component = fixture.componentInstance;
        component.placeholder = 'Amount';
        component.selectedToken = token;
        fixture.detectChanges();

        const inputDebugElement = fixture.debugElement.query(By.css('input'));
        input = inputDebugElement.nativeElement as HTMLInputElement;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should be empty by default', () => {
        expect(input.value).toBe('');
        expect(component.amount.isNaN()).toBe(true);
        expect(component.errors).toBeTruthy();
    });

    it('should convert the input to a BigNumber', () => {
        mockInput(fixture.debugElement, 'input', '0.000000000000000010');
        fixture.detectChanges();

        expect(input.value).toBe('0.000000000000000010');
        expect(component.amount.isEqualTo(10)).toBe(true);
        expect(component.errors).toBeFalsy();
    });

    it('should not show an error without a user input', () => {
        const errorsElement = fixture.debugElement.query(By.css('#errors'));
        expect(errorsElement).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        mockInput(fixture.debugElement, 'input', '0.0000000000000000101');
        fixture.detectChanges();
        expect(component.errors['tooManyDecimals']).toBe(true);
    });

    it('should show error when input is empty', () => {
        mockInput(fixture.debugElement, 'input', '');
        fixture.detectChanges();

        expect(component.amount.isNaN()).toBe(true);
        expect(component.errors['notANumber']).toBe(true);
    });

    it('should show error when input is not a number', () => {
        mockInput(fixture.debugElement, 'input', '1Hello');
        fixture.detectChanges();

        expect(component.amount.isNaN()).toBe(true);
        expect(component.errors['notANumber']).toBe(true);
    });

    it('should show error when input value is 0', () => {
        mockInput(fixture.debugElement, 'input', '0');
        fixture.detectChanges();

        expect(component.amount.isEqualTo(0)).toBe(true);
        expect(component.errors['zeroAmount']).toBe(true);
    });

    it('should show no error when input value is 0 and zero is allowed', () => {
        component.allowZero = true;
        mockInput(fixture.debugElement, 'input', '0');
        fixture.detectChanges();

        expect(component.amount.isEqualTo(0)).toBe(true);
        expect(component.errors).toBeFalsy();
    });

    it('should use 0 as decimals when no token selected', () => {
        component.selectedToken = undefined;
        mockInput(fixture.debugElement, 'input', '0.000000000000000010');
        fixture.detectChanges();
        expect(component.decimals).toBe(0);
        expect(component.errors['tooManyDecimals']).toBe(true);
    });

    it('should be able to set a value programmatically', () => {
        component.writeValue('0.00003');
        fixture.detectChanges();

        expect(input.value).toBe('0.00003');
        expect(component.amount.isEqualTo(30000000000000)).toBe(true);
        expect(component.errors).toBeFalsy();
    });

    it('should not to set a wrongly typed value programmatically', () => {
        component.writeValue(100);
        fixture.detectChanges();

        expect(input.value).toBe('');
        expect(component.amount.isNaN()).toBe(true);
    });
});
