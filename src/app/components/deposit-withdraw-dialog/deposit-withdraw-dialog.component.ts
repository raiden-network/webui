import {
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TokenInputComponent } from '../token-input/token-input.component';
import { DepositMode } from '../../utils/helpers';
import BigNumber from 'bignumber.js';

export interface DepositWithdrawDialogPayload {
    readonly decimals: number;
    readonly depositMode: DepositMode;
}

export interface DepositWithdrawDialogResult {
    readonly tokenAmount: BigNumber;
    readonly tokenAmountDecimals: number;
}

@Component({
    selector: 'app-deposit-dialog',
    templateUrl: './deposit-withdraw-dialog.component.html',
    styleUrls: ['./deposit-withdraw-dialog.component.css']
})
export class DepositWithdrawDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent, { static: true })
    tokenInput: TokenInputComponent;

    withdraw = false;

    form = this.fb.group({
        amount: new BigNumber(0)
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DepositWithdrawDialogPayload,
        public dialogRef: MatDialogRef<DepositWithdrawDialogComponent>,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.tokenInput.decimals = this.data.decimals;
        this.withdraw = this.data.depositMode === DepositMode.WITHDRAW;
        this.cdRef.detectChanges();
    }

    deposit() {
        const tokenAmount = this.form.value.amount;
        const tokenAmountDecimals = this.tokenInput.tokenAmountDecimals;
        this.dialogRef.close({ tokenAmount, tokenAmountDecimals });
    }
}
