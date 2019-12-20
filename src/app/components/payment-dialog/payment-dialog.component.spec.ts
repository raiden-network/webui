import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import BigNumber from 'bignumber.js';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
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
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { of } from 'rxjs';
import { PendingTransfer } from '../../models/pending-transfer';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { RaidenService } from '../../services/raiden.service';
import { UserToken } from '../../models/usertoken';

describe('PaymentDialogComponent', () => {
    let component: PaymentDialogComponent;
    let fixture: ComponentFixture<PaymentDialogComponent>;
    let pendingTransferPollingService: PendingTransferPollingService;

    const pendingTransfer: PendingTransfer = {
        channel_identifier: new BigNumber(255),
        initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
        locked_amount: new BigNumber(119),
        payment_identifier: new BigNumber(1),
        role: 'initiator',
        target: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
        transferred_amount: new BigNumber(331)
    };

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 0,
        balance: new BigNumber(20)
    };

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
                TestProviders.MockMatDialog(),
                PendingTransferPollingService
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

        pendingTransferPollingService = TestBed.get(
            PendingTransferPollingService
        );
        spyOn(TestBed.get(RaidenService), 'getUserToken').and.returnValue(
            token
        );

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
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([pendingTransfer]);

        mockAllInputs();
        const close = spyOn(component.dialogRef, 'close');
        const element = fixture.debugElement.query(By.css('#send'));
        element.triggerEventHandler('click', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            targetAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            amount: new BigNumber(10),
            paymentIdentifier: new BigNumber(999)
        });
    });

    it('should open the confirmation dialog if there is an identical payment pending', () => {
        const pendingTransfer2: PendingTransfer = {
            channel_identifier: new BigNumber(255),
            initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
            locked_amount: new BigNumber(10),
            payment_identifier: new BigNumber(999),
            role: 'initiator',
            target: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
            transferred_amount: new BigNumber(331)
        };
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            pendingTransfer2
        ]);
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        const close = spyOn(component.dialogRef, 'close');
        const element = fixture.debugElement.query(By.css('#send'));
        element.triggerEventHandler('click', {});

        const confirmationPayload = {
            title: 'Retrying payment',
            message:
                `There is already a payment of <strong>10 ${
                    token.symbol
                }</strong> being sent to <strong>0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359</strong>. <br/>` +
                'Are you sure you want to send the same payment again?'
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: confirmationPayload
        });
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            targetAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            amount: new BigNumber(10),
            paymentIdentifier: new BigNumber(999)
        });
    });

    it('should not open the confirmation dialog if the payment identifier is different', () => {
        const pendingTransfer2: PendingTransfer = {
            channel_identifier: new BigNumber(255),
            initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
            locked_amount: new BigNumber(10),
            payment_identifier: new BigNumber(1),
            role: 'initiator',
            target: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
            transferred_amount: new BigNumber(331)
        };
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            pendingTransfer2
        ]);
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        const close = spyOn(component.dialogRef, 'close');
        const element = fixture.debugElement.query(By.css('#send'));
        element.triggerEventHandler('click', {});

        expect(dialogSpy).toHaveBeenCalledTimes(0);
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            targetAddress: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            amount: new BigNumber(10),
            paymentIdentifier: new BigNumber(999)
        });
    });

    it('should not close the dialog if confirmation is denied', () => {
        const pendingTransfer2: PendingTransfer = {
            channel_identifier: new BigNumber(255),
            initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
            locked_amount: new BigNumber(10),
            payment_identifier: new BigNumber(999),
            role: 'initiator',
            target: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
            transferred_amount: new BigNumber(331)
        };
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            pendingTransfer2
        ]);
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.cancelled = true;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        const close = spyOn(component.dialogRef, 'close');
        const element = fixture.debugElement.query(By.css('#send'));
        element.triggerEventHandler('click', {});

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(0);
    });

    it('should not submit the dialog by enter if the form is invalid', () => {
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([pendingTransfer]);

        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(0);
    });
});
