import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TokenInputComponent } from '../token-input/token-input.component';
import BigNumber from 'bignumber.js';
import { UserToken } from '../../models/usertoken';

export interface ConnectionManagerDialogPayload {
    token: UserToken;
    funds: BigNumber;
}

@Component({
    selector: 'app-join-dialog',
    templateUrl: './connection-manager-dialog.component.html',
    styleUrls: ['./connection-manager-dialog.component.css']
})
export class ConnectionManagerDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: ['', Validators.required]
    });
    token: UserToken;
    funds = new BigNumber(0);

    constructor(
        @Inject(MAT_DIALOG_DATA) data: ConnectionManagerDialogPayload,
        private dialogRef: MatDialogRef<ConnectionManagerDialogComponent>,
        private fb: FormBuilder
    ) {
        const token = data.token;
        this.token = token;
        if (token.connected) {
            this.funds = token.connected.funds;
        }
    }

    ngOnInit(): void {
        this.tokenInput.selectedToken = this.token;
    }

    accept() {
        const payload: ConnectionManagerDialogPayload = {
            token: this.token,
            funds: this.form.value.amount
        };
        this.dialogRef.close(payload);
    }

    cancel() {
        this.dialogRef.close();
    }
}
