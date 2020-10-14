import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';
import {
    ConnectionManagerDialogComponent,
    ConnectionManagerDialogPayload,
} from './connection-manager-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import {
    mockInput,
    clickElement,
    mockOpenMatSelect,
    mockMatSelectFirst,
} from '../../../testing/interaction-helper';
import { By } from '@angular/platform-browser';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { createToken } from '../../../testing/test-data';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSelect } from '@angular/material/select';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';
import { TokenPollingService } from '../../services/token-polling.service';
import { of } from 'rxjs';
import { stub } from '../../../testing/stub';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { ClipboardModule } from 'ngx-clipboard';

describe('ConnectionManagerDialogComponent', () => {
    let component: ConnectionManagerDialogComponent;
    let fixture: ComponentFixture<ConnectionManagerDialogComponent>;

    const amountInput = '70';
    const token = createToken({
        decimals: 0,
        balance: new BigNumber(1000),
        connected: {
            channels: 5,
            funds: new BigNumber(10),
            sum_deposits: new BigNumber(50),
        },
    });

    beforeEach(
        waitForAsync(() => {
            const payload: ConnectionManagerDialogPayload = {
                funds: undefined,
                token: token,
            };

            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of([token]);
            tokenPollingMock.getTokenUpdates = () => of(token);

            TestBed.configureTestingModule({
                declarations: [
                    ConnectionManagerDialogComponent,
                    TokenInputComponent,
                    RaidenDialogComponent,
                    DecimalPipe,
                    DisplayDecimalsPipe,
                    TokenNetworkSelectorComponent,
                    BalanceWithSymbolComponent,
                ],
                providers: [
                    TestProviders.MockMatDialogData(payload),
                    TestProviders.MockMatDialogRef({ close: () => {} }),
                    TestProviders.MockRaidenConfigProvider(),
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    TestProviders.AddressBookStubProvider(),
                ],
                imports: [
                    MaterialComponentsModule,
                    ReactiveFormsModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                    HttpClientTestingModule,
                    ClipboardModule,
                ],
            }).compileComponents();
        })
    );

    describe('with token payload', () => {
        beforeEach(() => {
            fixture = TestBed.createComponent(ConnectionManagerDialogComponent);
            component = fixture.componentInstance;

            fixture.detectChanges();
        });

        it('should be created', () => {
            expect(component).toBeTruthy();
            fixture.destroy();
        });

        it('should close the dialog with the result when accept button is clicked', () => {
            mockInput(
                fixture.debugElement.query(By.directive(TokenInputComponent)),
                'input',
                amountInput
            );
            fixture.detectChanges();

            // @ts-ignore
            const closeSpy = spyOn(component.dialogRef, 'close');
            clickElement(fixture.debugElement, '#accept');
            fixture.detectChanges();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledWith({
                token: token,
                funds: new BigNumber(amountInput),
            });
        });

        it('should close the dialog with no result when cancel button is clicked', () => {
            mockInput(
                fixture.debugElement.query(By.directive(TokenInputComponent)),
                'input',
                amountInput
            );
            fixture.detectChanges();

            // @ts-ignore
            const closeSpy = spyOn(component.dialogRef, 'close');
            clickElement(fixture.debugElement, '#cancel');
            fixture.detectChanges();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledWith();
        });

        it('should set the maximum token amount to the balance', () => {
            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.directive(TokenInputComponent)
            ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(token.balance)).toBe(
                true
            );
        });
    });

    describe('without token payload', () => {
        beforeEach(() => {
            const payload: ConnectionManagerDialogPayload = {
                funds: undefined,
                token: undefined,
            };
            TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: payload });
            fixture = TestBed.createComponent(ConnectionManagerDialogComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should show a token network selector', () => {
            const selector = fixture.debugElement.query(
                By.directive(MatSelect)
            );
            expect(selector).toBeTruthy();
            expect(component.form.value.token).toBeFalsy();
        });

        it('should not set the maximum token amount by default', () => {
            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.directive(TokenInputComponent)
            ).componentInstance;
            expect(tokenInputComponent.maxAmount).toBeUndefined();
        });

        it('should set the maximum token amount after token selection', () => {
            const networkSelectorElement = fixture.debugElement.query(
                By.directive(TokenNetworkSelectorComponent)
            );
            mockOpenMatSelect(networkSelectorElement);
            fixture.detectChanges();
            mockMatSelectFirst(fixture.debugElement);
            fixture.detectChanges();

            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.directive(TokenInputComponent)
            ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(1000)).toBe(true);
        });
    });
});
