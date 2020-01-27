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
import { MatDialogContent } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { mockFormInput } from '../../../testing/interaction-helper';
import BigNumber from 'bignumber.js';

describe('DepositDialogComponent', () => {
    let component: DepositWithdrawDialogComponent;
    let fixture: ComponentFixture<DepositWithdrawDialogComponent>;

    beforeEach(async(() => {
        const payload: DepositWithdrawDialogPayload = {
            decimals: 8,
            depositMode: DepositMode.DEPOSIT
        };
        TestBed.configureTestingModule({
            declarations: [DepositWithdrawDialogComponent, TokenInputComponent],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.MockMatDialogData(payload),
                TestProviders.MockMatDialogRef({ close: () => {} }),
                TestProviders.MockRaidenConfigProvider()
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                NoopAnimationsModule
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

    it('should submit the dialog by enter', () => {
        mockFormInput(
            fixture.debugElement.query(By.directive(TokenInputComponent)),
            'inputControl',
            '10'
        );
        const close = spyOn(component.dialogRef, 'close');
        const dialog = fixture.debugElement.query(
            By.directive(MatDialogContent)
        );
        dialog.triggerEventHandler('keyup.enter', {});
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith({
            tokenAmount: new BigNumber(1000000000)
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
