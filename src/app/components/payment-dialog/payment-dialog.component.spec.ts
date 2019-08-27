import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import BigNumber from 'bignumber.js';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { SharedService } from '../../services/shared.service';
import { AddressInputComponent } from '../address-input/address-input.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';
import {
    PaymentDialogComponent,
    PaymentDialogPayload
} from './payment-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { mockFormInput } from '../../../testing/interaction-helper';
import { PaymentIdentifierInputComponent } from '../payment-identifier-input/payment-identifier-input.component';
import { BigNumberConversionDirective } from '../../directives/big-number-conversion.directive';

describe('PaymentDialogComponent', () => {
    let component: PaymentDialogComponent;
    let fixture: ComponentFixture<PaymentDialogComponent>;

    function mockAllInputs() {
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
            '10'
        );
        mockFormInput(
            fixture.debugElement.query(
                By.directive(PaymentIdentifierInputComponent)
            ),
            'identifierFc',
            '999'
        );
    }

    beforeEach(async(() => {
        const payload: PaymentDialogPayload = {
            tokenAddress: '',
            amount: new BigNumber(0),
            targetAddress: '',
            decimals: 0,
            paymentIdentifier: null
        };
        TestBed.configureTestingModule({
            declarations: [
                PaymentDialogComponent,
                TokenPipe,
                TokenInputComponent,
                AddressInputComponent,
                TokenNetworkSelectorComponent,
                PaymentIdentifierInputComponent,
                BigNumberConversionDirective
            ],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} }),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.HammerJSProvider(),
                SharedService
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(false);
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should reset the form when the reset button is clicked', () => {
        mockAllInputs();
        const element = fixture.debugElement.query(By.css('#reset'));
        element.triggerEventHandler('click', {});
        expect(component.form.value).toEqual({
            target_address: '',
            token: '',
            amount: new BigNumber(0),
            payment_identifier: null
        });
        expect(component.form.invalid).toBe(true);
    });

    it('should close the dialog with the result when send button is clicked', () => {
        mockAllInputs();
        const close = spyOn(component.dialogRef, 'close');
        const element = fixture.debugElement.query(By.css('#send'));
        element.triggerEventHandler('click', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            targetAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            decimals: 0,
            amount: new BigNumber(10),
            paymentIdentifier: new BigNumber(999)
        });
    });
});
