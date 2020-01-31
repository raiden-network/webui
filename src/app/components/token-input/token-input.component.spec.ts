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
    }

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenInputComponent],
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
});
