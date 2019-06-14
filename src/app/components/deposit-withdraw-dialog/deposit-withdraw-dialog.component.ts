import {
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { TokenInputComponent } from '../token-input/token-input.component';
import { DepositMode } from '../../utils/helpers';

export interface DepositWithdrawDialogPayload {
    readonly decimals: number;
    readonly depositMode: DepositMode;
}

export interface DepositWithdrawDialogResult {
    readonly tokenAmount: number;
    readonly tokenAmountDecimals: number;
}

@Component({
    selector: 'app-deposit-dialog',
    templateUrl: './deposit-withdraw-dialog.component.html',
    styleUrls: ['./deposit-withdraw-dialog.component.css']
})
export class DepositWithdrawDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent) tokenInput: TokenInputComponent;

    withdraw = false;

    form = this.fb.group({
        amount: 0
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
        const tokenInput = this.tokenInput;
        const tokenAmount = tokenInput.tokenAmount.toNumber();
        const tokenAmountDecimals = tokenInput.tokenAmountDecimals;
        this.dialogRef.close({ tokenAmount, tokenAmountDecimals });
    }
}
