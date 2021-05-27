import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';
import {
    DepositWithdrawDialogComponent,
    DepositWithdrawDialogPayload,
} from './deposit-withdraw-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { DepositMode } from '../../models/deposit-mode.enum';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { By } from '@angular/platform-browser';
import { mockInput, clickElement } from '../../../testing/interaction-helper';
import BigNumber from 'bignumber.js';
import { stub } from '../../../testing/stub';
import { TokenPollingService } from '../../services/token-polling.service';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { createToken, createChannel } from '../../../testing/test-data';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { ClipboardModule } from 'ngx-clipboard';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';

describe('DepositWithdrawDialogComponent', () => {
    let component: DepositWithdrawDialogComponent;
    let fixture: ComponentFixture<DepositWithdrawDialogComponent>;

    const amountInput = '3333';
    const token = createToken({
        decimals: 0,
        balance: new BigNumber(4000),
    });
    const channel = createChannel({
        userToken: token,
        balance: new BigNumber(57),
    });

    beforeEach(
        waitForAsync(() => {
            const payload: DepositWithdrawDialogPayload = {
                channel,
                depositMode: DepositMode.DEPOSIT,
            };

            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of([token]);
            tokenPollingMock.getTokenUpdates = () => of(token);

            const channelPollingMock = stub<ChannelPollingService>();
            channelPollingMock.getChannelUpdates = () => of(channel);

            TestBed.configureTestingModule({
                declarations: [
                    DepositWithdrawDialogComponent,
                    TokenInputComponent,
                    RaidenDialogComponent,
                    DecimalPipe,
                    DisplayDecimalsPipe,
                    BalanceWithSymbolComponent,
                ],
                providers: [
                    TestProviders.MockMatDialogData(payload),
                    TestProviders.MockMatDialogRef(),
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    {
                        provide: ChannelPollingService,
                        useValue: channelPollingMock,
                    },
                    TestProviders.MockRaidenConfigProvider(),
                    TestProviders.AddressBookStubProvider(),
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

    describe('as deposit dialog', () => {
        beforeEach(() => {
            fixture = TestBed.createComponent(DepositWithdrawDialogComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
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
            fixture.debugElement
                .query(By.css('form'))
                .triggerEventHandler('submit', {});
            fixture.detectChanges();

            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledWith({
                tokenAmount: new BigNumber(amountInput),
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

        it('should set the maximum token amount to the token balance', () => {
            const tokenInputComponent: TokenInputComponent =
                fixture.debugElement.query(
                    By.directive(TokenInputComponent)
                ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(token.balance)).toBe(
                true
            );
        });
    });

    describe('as deposit dialog', () => {
        beforeEach(() => {
            const payload: DepositWithdrawDialogPayload = {
                channel,
                depositMode: DepositMode.WITHDRAW,
            };
            TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: payload });
            fixture = TestBed.createComponent(DepositWithdrawDialogComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should set the maximum token amount to the channel balance', () => {
            const tokenInputComponent: TokenInputComponent =
                fixture.debugElement.query(
                    By.directive(TokenInputComponent)
                ).componentInstance;
            expect(
                tokenInputComponent.maxAmount.isEqualTo(channel.balance)
            ).toBe(true);
        });
    });
});
