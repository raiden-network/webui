import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BalanceWithSymbolComponent } from 'app/components/balance-with-symbol/balance-with-symbol.component';
import { TokenInputComponent } from 'app/components/token-input/token-input.component';
import { DepositMode } from 'app/models/deposit-mode.enum';
import { MaterialComponentsModule } from 'app/modules/material-components/material-components.module';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { DecimalPipe } from 'app/pipes/decimal.pipe';
import { DisplayDecimalsPipe } from 'app/pipes/display-decimals.pipe';
import {
    UserDepositService,
    WithdrawPlan,
} from 'app/services/user-deposit.service';
import BigNumber from 'bignumber.js';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject } from 'rxjs';
import { clickElement, mockInput } from 'testing/interaction-helper';
import { MockMatDialog } from 'testing/mock-mat-dialog';
import { createToken } from 'testing/test-data';
import { TestProviders } from 'testing/test-providers';
import { DepositWithdrawFormComponent } from './deposit-withdraw-form.component';

describe('DepositWithdrawFormComponent', () => {
    let component: DepositWithdrawFormComponent;
    let fixture: ComponentFixture<DepositWithdrawFormComponent>;

    const servicesToken = createToken({
        balance: new BigNumber('10000000000000'),
    });
    const udcBalance = new BigNumber('9000000');

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DepositWithdrawFormComponent,
                TokenInputComponent,
                BalanceWithSymbolComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.MockMatDialog(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.MockUserDepositService(servicesToken, udcBalance),
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
    });

    describe('as deposit form', () => {
        beforeEach(() => {
            fixture = TestBed.createComponent(DepositWithdrawFormComponent);
            component = fixture.componentInstance;
            component.inputMode = DepositMode.DEPOSIT;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should set the maximum token amount to the token balance', () => {
            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.directive(TokenInputComponent)
            ).componentInstance;
            expect(
                tokenInputComponent.maxAmount.isEqualTo(servicesToken.balance)
            ).toBe(true);
        });

        it('should submit the deposit amount', fakeAsync(() => {
            const acceptSpy = spyOn(component.accept, 'emit');

            mockInput(
                fixture.debugElement.query(By.directive(TokenInputComponent)),
                'input',
                '0.0000000000003'
            );
            fixture.detectChanges();
            fixture.debugElement
                .query(By.css('form'))
                .triggerEventHandler('submit', {});
            fixture.detectChanges();
            tick();

            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy).toHaveBeenCalledWith(new BigNumber('300000'));
        }));
    });

    describe('as withdraw form', () => {
        let withdrawPlanSubject: BehaviorSubject<WithdrawPlan>;

        beforeEach(() => {
            fixture = TestBed.createComponent(DepositWithdrawFormComponent);
            component = fixture.componentInstance;
            component.inputMode = DepositMode.WITHDRAW;

            const userDepositService = TestBed.inject(UserDepositService);
            withdrawPlanSubject = new BehaviorSubject({
                amount: new BigNumber(0),
                withdrawBlock: 0,
            });
            //@ts-ignore
            userDepositService.withdrawPlan$ = withdrawPlanSubject.asObservable();
            fixture.detectChanges();
        });

        it('should set the maximum token amount to the UDC balance', () => {
            const tokenInputComponent: TokenInputComponent = fixture.debugElement.query(
                By.directive(TokenInputComponent)
            ).componentInstance;
            expect(tokenInputComponent.maxAmount.isEqualTo(udcBalance)).toBe(
                true
            );
        });

        it('should submit the withdraw amount', fakeAsync(() => {
            const acceptSpy = spyOn(component.accept, 'emit');

            mockInput(
                fixture.debugElement.query(By.directive(TokenInputComponent)),
                'input',
                '0.0000000000003'
            );
            fixture.detectChanges();
            fixture.debugElement
                .query(By.css('form'))
                .triggerEventHandler('submit', {});
            fixture.detectChanges();
            tick();

            expect(acceptSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy).toHaveBeenCalledWith(new BigNumber('300000'));
        }));

        it('should not submit the withdraw amount if the user cancels an override', fakeAsync(() => {
            const acceptSpy = spyOn(component.accept, 'emit');
            withdrawPlanSubject.next({
                amount: new BigNumber(10000),
                withdrawBlock: 9498430,
            });
            const dialog = (TestBed.inject(
                MatDialog
            ) as unknown) as MockMatDialog;
            dialog.cancelled = true;
            const dialogSpy = spyOn(dialog, 'open').and.callThrough();

            mockInput(
                fixture.debugElement.query(By.directive(TokenInputComponent)),
                'input',
                '0.0000000000003'
            );
            fixture.detectChanges();
            fixture.debugElement
                .query(By.css('form'))
                .triggerEventHandler('submit', {});
            fixture.detectChanges();
            tick();

            expect(dialogSpy).toHaveBeenCalledTimes(1);
            expect(acceptSpy).toHaveBeenCalledTimes(0);
        }));
    });
});
