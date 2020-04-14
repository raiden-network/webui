import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TokenInputComponent } from '../token-input/token-input.component';
import { DepositMode } from '../../models/deposit-mode.enum';
import BigNumber from 'bignumber.js';
import { UserToken } from '../../models/usertoken';

export interface DepositWithdrawDialogPayload {
    readonly token: UserToken;
    readonly depositMode: DepositMode;
}

export interface DepositWithdrawDialogResult {
    readonly tokenAmount: BigNumber;
}

@Component({
    selector: 'app-deposit-dialog',
    templateUrl: './deposit-withdraw-dialog.component.html',
    styleUrls: ['./deposit-withdraw-dialog.component.css'],
})
export class DepositWithdrawDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: ['', Validators.required],
    });
    token: UserToken;
    withdraw = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) data: DepositWithdrawDialogPayload,
        private dialogRef: MatDialogRef<DepositWithdrawDialogComponent>,
        private fb: FormBuilder
    ) {
        this.token = data.token;
        this.withdraw = data.depositMode === DepositMode.WITHDRAW;
    }

    ngOnInit(): void {
        this.tokenInput.selectedToken = this.token;
    }

    accept() {
        const tokenAmount = this.form.value.amount;
        this.dialogRef.close({ tokenAmount });
    }

    cancel() {
        this.dialogRef.close();
    }
}
