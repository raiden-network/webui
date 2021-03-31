import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DepositMode } from 'app/models/deposit-mode.enum';
import { MaterialComponentsModule } from 'app/modules/material-components/material-components.module';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { DecimalPipe } from 'app/pipes/decimal.pipe';
import { DisplayDecimalsPipe } from 'app/pipes/display-decimals.pipe';
import { RaidenService } from 'app/services/raiden.service';
import {
    UserDepositService,
    WithdrawPlan,
} from 'app/services/user-deposit.service';
import { getMintAmount } from 'app/shared/mint-amount';
import BigNumber from 'bignumber.js';
import { ClipboardModule } from 'ngx-clipboard';
import { BehaviorSubject, of } from 'rxjs';
import { clickElement } from 'testing/interaction-helper';
import { createToken } from 'testing/test-data';
import { TestProviders } from 'testing/test-providers';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { DepositWithdrawFormComponent } from './deposit-withdraw-form/deposit-withdraw-form.component';
import { UserDepositDialogComponent } from './user-deposit-dialog.component';

describe('UserDepositDialogComponent', () => {
    let component: UserDepositDialogComponent;
    let fixture: ComponentFixture<UserDepositDialogComponent>;

    const servicesToken = createToken();
    let withdrawPlanSubject: BehaviorSubject<WithdrawPlan>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                UserDepositDialogComponent,
                RaidenDialogComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                BalanceWithSymbolComponent,
                DepositWithdrawFormComponent,
                TokenInputComponent,
            ],
            providers: [
                TestProviders.MockMatDialogRef(),
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                TestProviders.MockUserDepositService(servicesToken),
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

    beforeEach(() => {
        fixture = TestBed.createComponent(UserDepositDialogComponent);
        component = fixture.componentInstance;

        const userDepositService = TestBed.inject(UserDepositService);
        withdrawPlanSubject = new BehaviorSubject({
            amount: new BigNumber(0),
            withdrawBlock: 0,
        });
        //@ts-ignore
        userDepositService.withdrawPlan$ = withdrawPlanSubject.asObservable();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog', () => {
        const dialogRef = TestBed.inject(MatDialogRef);
        const closeSpy = spyOn(dialogRef, 'close');
        fixture.debugElement
            .query(By.css('form'))
            .triggerEventHandler('submit', {});
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith();
    });

    it('should mint tokens', () => {
        const raidenService = TestBed.inject(RaidenService);
        const mintSpy = spyOn(raidenService, 'mintToken').and.returnValue(
            of(null)
        );

        clickElement(fixture.debugElement, '#mint');
        fixture.detectChanges();

        expect(mintSpy).toHaveBeenCalledTimes(1);
        expect(mintSpy).toHaveBeenCalledWith(
            servicesToken,
            getMintAmount(servicesToken.decimals)
        );
    });

    it('should hide input by default', () => {
        expect(component.inputActive).toBe(false);
        expect(component.inputMode).toBe(undefined);
    });

    it('should deposit to UDC', () => {
        const userDepositService = TestBed.inject(UserDepositService);
        const depositSpy = spyOn(userDepositService, 'deposit').and.returnValue(
            of(null)
        );

        clickElement(fixture.debugElement, '#deposit');
        fixture.detectChanges();
        expect(component.inputActive).toBe(true);
        expect(component.inputMode).toBe(DepositMode.DEPOSIT);

        const depositForm: DepositWithdrawFormComponent = fixture.debugElement.query(
            By.directive(DepositWithdrawFormComponent)
        ).componentInstance;
        const depositAmount = new BigNumber(200);
        depositForm.accept.emit(depositAmount);
        fixture.detectChanges();

        expect(component.inputActive).toBe(false);
        expect(component.inputMode).toBe(undefined);
        expect(depositSpy).toHaveBeenCalledTimes(1);
        expect(depositSpy).toHaveBeenCalledWith(depositAmount);
    });

    it('should plan a withdrawal from UDC', () => {
        const userDepositService = TestBed.inject(UserDepositService);
        const planWithdrawSpy = spyOn(
            userDepositService,
            'planWithdraw'
        ).and.returnValue(of(null));

        clickElement(fixture.debugElement, '#plan-withdraw');
        fixture.detectChanges();
        expect(component.inputActive).toBe(true);
        expect(component.inputMode).toBe(DepositMode.WITHDRAW);

        const planWithdrawForm: DepositWithdrawFormComponent = fixture.debugElement.query(
            By.directive(DepositWithdrawFormComponent)
        ).componentInstance;
        const withdrawAmount = new BigNumber(70);
        planWithdrawForm.accept.emit(withdrawAmount);
        fixture.detectChanges();

        expect(component.inputActive).toBe(false);
        expect(component.inputMode).toBe(undefined);
        expect(planWithdrawSpy).toHaveBeenCalledTimes(1);
        expect(planWithdrawSpy).toHaveBeenCalledWith(withdrawAmount);
    });

    it('should withdraw from UDC', () => {
        const userDepositService = TestBed.inject(UserDepositService);
        const withdrawSpy = spyOn(
            userDepositService,
            'withdraw'
        ).and.returnValue(of(null));
        const withdrawAmount = new BigNumber(60000);
        withdrawPlanSubject.next({
            amount: withdrawAmount,
            withdrawBlock: 9498430,
        });
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#withdraw');
        fixture.detectChanges();

        expect(withdrawSpy).toHaveBeenCalledTimes(1);
        expect(withdrawSpy).toHaveBeenCalledWith(withdrawAmount);
    });
});
