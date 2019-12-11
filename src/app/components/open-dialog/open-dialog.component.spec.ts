import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { AddressInputComponent } from '../address-input/address-input.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';

import {
    OpenDialogComponent,
    OpenDialogPayload
} from './open-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import {
    errorMessage,
    mockInput,
    mockFormInput
} from '../../../testing/interaction-helper';
import { MatDialogContent } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BigNumberConversionDirective } from '../../directives/big-number-conversion.directive';
import BigNumber from 'bignumber.js';
import { RaidenService } from '../../services/raiden.service';
import { UserToken } from '../../models/usertoken';

describe('OpenDialogComponent', () => {
    let component: OpenDialogComponent;
    let fixture: ComponentFixture<OpenDialogComponent>;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(20)
    };

    beforeEach(async(() => {
        const payload: OpenDialogPayload = {
            ownAddress: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
            defaultSettleTimeout: 500,
            revealTimeout: 10
        };

        TestBed.configureTestingModule({
            declarations: [
                OpenDialogComponent,
                TokenInputComponent,
                AddressInputComponent,
                TokenPipe,
                TokenNetworkSelectorComponent,
                BigNumberConversionDirective
            ],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} }),
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

        spyOn(TestBed.get(RaidenService), 'getUserToken').and.returnValue(
            token
        );

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

    it('should submit the dialog by enter', () => {
        mockFormInput(
            fixture.debugElement.query(By.directive(AddressInputComponent)),
            'inputFieldFc',
            '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
        mockFormInput(
            fixture.debugElement.query(
                By.directive(TokenNetworkSelectorComponent)
            ),
            'tokenFc',
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        );
        mockFormInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'inputControl',
            '0'
        );
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            partnerAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            settleTimeout: 500,
            balance: new BigNumber(0)
        });
    });

    it('should not submit the dialog by enter if the form is invalid', () => {
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(0);
    });
});
