import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import { By } from '@angular/platform-browser';

import { PaymentIdentifierInputComponent } from './payment-identifier-input.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { mockInput, clickElement } from '../../../testing/interaction-helper';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PaymentIdentifierInputComponent', () => {
    let component: PaymentIdentifierInputComponent;
    let fixture: ComponentFixture<PaymentIdentifierInputComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PaymentIdentifierInputComponent],
            providers: [
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher,
                },
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                HttpClientTestingModule,
                RaidenIconsModule,
            ],
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
        const inputElement = fixture.debugElement.query(By.css('input'));
        expect(inputElement).toBeFalsy();
    });

    it('should show the identifier input when it is expanded', () => {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        const inputElement = fixture.debugElement.query(By.css('input'));
        expect(inputElement).toBeTruthy();
        expect(inputElement.nativeElement.value).toBe('');
    });

    it('should not show an error without a user input', () => {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        const errorsElement = fixture.debugElement.query(By.css('#errors'));
        expect(errorsElement).toBeFalsy();
    });

    it('should show error when input is not a number', () => {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        mockInput(fixture.debugElement, 'input', '1Hello');
        fixture.detectChanges();

        expect(component.identifier.isNaN()).toBe(true);
        expect(component.errors['notANumber']).toBe(true);
    });

    it('should show an error when input value is less than 0', () => {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        mockInput(fixture.debugElement, 'input', '-50');
        fixture.detectChanges();

        expect(component.errors['negativeIdentifier']).toBe(true);
    });

    it('should reset the input when it is closed', () => {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        mockInput(fixture.debugElement, 'input', '1000');
        fixture.detectChanges();
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();

        const inputElement = fixture.debugElement.query(By.css('input'));
        expect(inputElement).toBeFalsy();
        expect(component.identifier.isNaN()).toBe(true);
    });
});
