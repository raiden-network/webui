import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenInputComponent } from '../token-input/token-input.component';
import {
    DepositWithdrawDialogComponent,
    DepositWithdrawDialogPayload
} from './deposit-withdraw-dialog.component';
import { TestProviders } from '../../../testing/test-providers';
import { DepositMode } from '../../utils/helpers';
import { RaidenDialogComponent } from '../raiden-dialog/raiden-dialog.component';
import { By } from '@angular/platform-browser';
import { mockInput, clickElement } from '../../../testing/interaction-helper';
import BigNumber from 'bignumber.js';

describe('DepositWithdrawDialogComponent', () => {
    let component: DepositWithdrawDialogComponent;
    let fixture: ComponentFixture<DepositWithdrawDialogComponent>;

    const amountInput = '3333';

    beforeEach(async(() => {
        const payload: DepositWithdrawDialogPayload = {
            token: undefined,
            depositMode: DepositMode.DEPOSIT
        };
        TestBed.configureTestingModule({
            declarations: [
                DepositWithdrawDialogComponent,
                TokenInputComponent,
                RaidenDialogComponent
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} })
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule
            ]
        }).compileComponents();
    }));

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
        clickElement(fixture.debugElement, '#accept');
        fixture.detectChanges();

        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy).toHaveBeenCalledWith({
            tokenAmount: new BigNumber(amountInput)
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
});
