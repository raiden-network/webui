import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
import { mockInput } from '../../../testing/interaction-helper';

describe('PaymentDialogComponent', () => {
    let component: PaymentDialogComponent;
    let fixture: ComponentFixture<PaymentDialogComponent>;

    function input(
        componentDirective: Type<any>,
        formControlProperty: string,
        val: string
    ) {
        const inputElement = fixture.debugElement.query(
            By.directive(componentDirective)
        );
        const formControl = inputElement.componentInstance[formControlProperty];
        mockInput(inputElement, 'input', val);
        formControl.setValue(val);
        formControl.markAsDirty();
        formControl.markAsTouched();
    }

    beforeEach(async(() => {
        const payload: PaymentDialogPayload = {
            tokenAddress: '',
            amount: 0,
            targetAddress: '',
            decimals: 0
        };
        TestBed.configureTestingModule({
            declarations: [
                PaymentDialogComponent,
                TokenPipe,
                TokenInputComponent,
                AddressInputComponent,
                TokenNetworkSelectorComponent
            ],
            providers: [
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef(),
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

    it('should reset the form when the reset button is clicked', async () => {
        input(
            AddressInputComponent,
            'inputFieldFc',
            '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
        input(
            TokenNetworkSelectorComponent,
            'tokenFc',
            '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
        );
        input(TokenInputComponent, 'inputControl', '10');
        const element = fixture.debugElement.query(By.css('#reset'));
        element.triggerEventHandler('click', {});
        expect(component.form.value).toEqual({
            target_address: '',
            token: '',
            amount: 0
        });
        expect(component.form.invalid).toBeTruthy;
    });
});
