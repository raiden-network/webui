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

describe('DepositDialogComponent', () => {
    let component: DepositWithdrawDialogComponent;
    let fixture: ComponentFixture<DepositWithdrawDialogComponent>;

    beforeEach(async(() => {
        const payload: DepositWithdrawDialogPayload = {
            token: undefined,
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
});
