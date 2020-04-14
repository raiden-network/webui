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
    styleUrls: ['./connection-manager-dialog.component.css'],
})
export class ConnectionManagerDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: ['', Validators.required],
        token: [undefined, Validators.required],
    });
    initiatedWithoutToken = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: ConnectionManagerDialogPayload,
        private dialogRef: MatDialogRef<ConnectionManagerDialogComponent>,
        private fb: FormBuilder
    ) {
        this.initiatedWithoutToken = !data.token;
    }

    ngOnInit() {
        if (this.data.token) {
            this.tokenNetworkSelected(this.data.token);
        }
    }

    tokenNetworkSelected(token: UserToken) {
        this.form.get('token').setValue(token);
        this.tokenInput.selectedToken = token;
    }

    accept() {
        const payload: ConnectionManagerDialogPayload = {
            token: this.form.value.token,
            funds: this.form.value.amount,
        };
        this.dialogRef.close(payload);
    }

    cancel() {
        this.dialogRef.close();
    }
}
