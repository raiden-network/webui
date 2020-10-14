import { HttpClientTestingModule } from '@angular/common/http/testing';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import BigNumber from 'bignumber.js';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { AddressInputComponent } from '../address-input/address-input.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';
import {
    PaymentDialogComponent,
    PaymentDialogPayload,
} from './payment-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import {
    mockInput,
    mockOpenMatSelect,
    mockMatSelectFirst,
    clickElement,
} from '../../../testing/interaction-helper';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload,
} from '../confirmation-dialog/confirmation-dialog.component';
import { RaidenService } from '../../services/raiden.service';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import {
    createToken,
    createAddress,
    createPendingTransfer,
} from '../../../testing/test-data';
import { stub } from '../../../testing/stub';
import { TokenPollingService } from '../../services/token-polling.service';
import { AddressBookService } from '../../services/address-book.service';
import { Contacts } from '../../models/contact';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { ClipboardModule } from 'ngx-clipboard';
import { PaymentIdentifierInputComponent } from '../payment-identifier-input/payment-identifier-input.component';

describe('PaymentDialogComponent', () => {
    let component: PaymentDialogComponent;
    let fixture: ComponentFixture<PaymentDialogComponent>;

    let pendingTransferPollingService: PendingTransferPollingService;

    const token = createToken({
        decimals: 0,
        connected: {
            channels: 5,
            funds: new BigNumber(10),
            sum_deposits: new BigNumber(50),
        },
    });
    const addressInput = createAddress();
    const amountInput = '10';
    const identifierInput = '543210';
    const pendingTransfer = createPendingTransfer();
    const identicalPendingTransfer = createPendingTransfer({
        target: addressInput,
        token_address: token.address,
        locked_amount: new BigNumber(amountInput),
        payment_identifier: new BigNumber(identifierInput),
    });

    function mockAllInputs() {
        mockInput(
            fixture.debugElement.query(By.directive(AddressInputComponent)),
            'input',
            addressInput
        );
        mockInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'input',
            amountInput
        );

        const networkSelectorElement = fixture.debugElement.query(
            By.directive(TokenNetworkSelectorComponent)
        );
        mockOpenMatSelect(networkSelectorElement);
        fixture.detectChanges();
        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();
    }

    function mockPaymentIdentifier(value = identifierInput) {
        clickElement(fixture.debugElement, '#toggle-identifier');
        fixture.detectChanges();
        mockInput(
            fixture.debugElement.query(
                By.directive(PaymentIdentifierInputComponent)
            ),
            'input',
            value
        );
    }

    beforeEach(
        waitForAsync(() => {
            const payload: PaymentDialogPayload = {
                tokenAddress: '',
                amount: undefined,
                targetAddress: '',
            };

            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of([token]);

            const pendingTransferPollingMock = stub<
                PendingTransferPollingService
            >();
            // @ts-ignore
            pendingTransferPollingMock.pendingTransfers$ = of([
                pendingTransfer,
            ]);

            TestBed.configureTestingModule({
                declarations: [
                    PaymentDialogComponent,
                    TokenInputComponent,
                    AddressInputComponent,
                    TokenNetworkSelectorComponent,
                    RaidenDialogComponent,
                    BalanceWithSymbolComponent,
                    PaymentIdentifierInputComponent,
                ],
                providers: [
                    TestProviders.MockMatDialogData(payload),
                    TestProviders.MockMatDialogRef({ close: () => {} }),
                    TestProviders.MockRaidenConfigProvider(),
                    TestProviders.AddressBookStubProvider(),
                    TestProviders.MockMatDialog(),
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    {
                        provide: PendingTransferPollingService,
                        useValue: pendingTransferPollingMock,
                    },
                ],
                imports: [
                    MaterialComponentsModule,
                    NoopAnimationsModule,
                    ReactiveFormsModule,
                    HttpClientTestingModule,
                    RaidenIconsModule,
                    ClipboardModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentDialogComponent);
        component = fixture.componentInstance;

        pendingTransferPollingService = TestBed.inject(
            PendingTransferPollingService
        );
        spyOn(TestBed.inject(RaidenService), 'getUserToken').and.returnValue(
            token
        );

        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog with the result when accept button is clicked', () => {
        mockAllInputs();
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith({
            tokenAddress: token.address,
            targetAddress: addressInput,
            amount: new BigNumber(amountInput),
            paymentIdentifier: undefined,
        });
    });

    it('should include the payment identifier in the result', () => {
        mockAllInputs();
        mockPaymentIdentifier();
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith({
            tokenAddress: token.address,
            targetAddress: addressInput,
            amount: new BigNumber(amountInput),
            paymentIdentifier: new BigNumber(identifierInput),
        });
    });

    it('should close the dialog with no result when cancel button is clicked', () => {
        mockAllInputs();
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#cancel');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });

    it('should open the confirmation dialog if there is an identical payment pending', () => {
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            identicalPendingTransfer,
        ]);
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        mockPaymentIdentifier();
        // @ts-ignore
        const close = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        const payload: ConfirmationDialogPayload = {
            title: 'Retrying Transfer',
            message: `There is already a transfer of ${amountInput} ${token.symbol} being sent to ${addressInput}. Are you sure you want to send the same transfer again?`,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAddress: token.address,
            targetAddress: addressInput,
            amount: new BigNumber(amountInput),
            paymentIdentifier: new BigNumber(identifierInput),
        });
    });

    it('should open the confirmation dialog with contact label', () => {
        const addressBookService: AddressBookService = TestBed.inject(
            AddressBookService
        );
        const contacts: Contacts = { [addressInput]: 'Test account' };
        addressBookService.get = () => contacts;
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            identicalPendingTransfer,
        ]);
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        const payload: ConfirmationDialogPayload = {
            title: 'Retrying Transfer',
            message: `There is already a transfer of ${amountInput} ${token.symbol} being sent to Test account ${addressInput}. Are you sure you want to send the same transfer again?`,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, {
            data: payload,
            width: '360px',
        });
    });

    it('should not close the dialog if confirmation is denied', () => {
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            identicalPendingTransfer,
        ]);
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        dialog.cancelled = true;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        mockAllInputs();
        // @ts-ignore
        const close = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(0);
    });

    it('should not open the confirmation dialog if the identifier is different on the pending payment', () => {
        // @ts-ignore
        pendingTransferPollingService.pendingTransfers$ = of([
            identicalPendingTransfer,
        ]);
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();

        const differentIdentifier = pendingTransfer.payment_identifier.plus(1);
        mockAllInputs();
        mockPaymentIdentifier(differentIdentifier.toString());
        // @ts-ignore
        const closeSpy = spyOn(component.dialogRef, 'close');
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(dialogSpy).toHaveBeenCalledTimes(0);
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith({
            tokenAddress: token.address,
            targetAddress: addressInput,
            amount: new BigNumber(amountInput),
            paymentIdentifier: differentIdentifier,
        });
    });
});
