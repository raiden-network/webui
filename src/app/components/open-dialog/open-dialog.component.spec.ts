import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { AddressInputComponent } from '../address-input/address-input.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';

import { OpenDialogComponent } from './open-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material';
import { errorMessage, mockInput } from '../../../testing/interaction-helper';

describe('OpenDialogComponent', () => {
    let component: OpenDialogComponent;
    let fixture: ComponentFixture<OpenDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                OpenDialogComponent,
                TokenInputComponent,
                AddressInputComponent,
                TokenPipe,
                TokenNetworkSelectorComponent
            ],
            providers: [
                TestProviders.MockMatDialogData(),
                TestProviders.MockMatDialogRef(),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.HammerJSProvider(),
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OpenDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(false);
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors for the settle timeout while the user types', () => {
        mockInput(
            fixture.debugElement,
            'input[formControlName="settle_timeout"]',
            '0.1'
        );
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'The settle timeout has to be a number greater than zero'
        );
    });
});
