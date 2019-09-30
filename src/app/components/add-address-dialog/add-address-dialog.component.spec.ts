import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAddressDialogComponent } from './add-address-dialog.component';
import { AddressInputComponent } from '../address-input/address-input.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestProviders } from '../../../testing/test-providers';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LocalStorageAdapter } from '../../adapters/local-storage-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
    clickElement,
    mockInput,
    errorMessage
} from '../../../testing/interaction-helper';
import Spy = jasmine.Spy;
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

// noinspection Angular2DeclarationMembershipInModule
@Component({
    template: `
        <app-add-address-dialog></app-add-address-dialog>
    `
})
class TestHostComponent {}

describe('AddAddressDialogComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let spy: Spy;

    function getDebugElement() {
        return fixture.debugElement.query(
            By.directive(AddAddressDialogComponent)
        );
    }

    beforeEach(async(() => {
        const spyObj = jasmine.createSpyObj('MatDialogRef', ['close']);
        spy = spyObj.close;
        TestBed.configureTestingModule({
            declarations: [
                TestHostComponent,
                AddAddressDialogComponent,
                AddressInputComponent
            ],
            providers: [
                TestProviders.MockMatDialogRef(spyObj),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                {
                    provide: LocalStorageAdapter,
                    useValue: {}
                },
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ],
            imports: [
                MaterialComponentsModule,
                FormsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the values when the user presses the confirm button', function() {
        const element = getDebugElement();
        mockInput(
            element,
            `input[placeholder="Address"]`,
            '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C'
        );
        mockInput(element, `input[placeholder="Label"]`, 'Test Node');

        fixture.detectChanges();

        clickElement(fixture.debugElement, '#addresses-save');

        fixture.detectChanges();

        expect(spy.calls.argsFor(0)[0]).toEqual({
            address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C',
            label: 'Test Node'
        });
    });

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        mockInput(fixture.debugElement, '#addresses-label', '');
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'The label cannot be empty!'
        );
    });
});
