import { Component, Inject, ViewChild } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { AddressInputComponent } from '../address-input/address-input.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import BigNumber from 'bignumber.js';

export interface OpenDialogPayload {
    readonly tokenAddress: string;
    readonly defaultSettleTimeout: number;
    readonly revealTimeout: number;
}

export interface OpenDialogResult {
    tokenAddress: string;
    partnerAddress: string;
    settleTimeout: number;
    balance: BigNumber;
}

@Component({
    selector: 'app-open-dialog',
    templateUrl: './open-dialog.component.html',
    styleUrls: ['./open-dialog.component.css']
})
export class OpenDialogComponent {
    public form: FormGroup = this.fb.group({
        address: '',
        token: this.data.tokenAddress,
        amount: new BigNumber(0),
        settle_timeout: [
            this.data.defaultSettleTimeout,
            [
                (control: AbstractControl) => {
                    const value = parseInt(control.value, 10);
                    if (isNaN(value) || value <= 0) {
                        return { invalidAmount: true };
                    } else {
                        return undefined;
                    }
                },
                Validators.min(this.data.revealTimeout * 2)
            ]
        ]
    });

    @ViewChild(TokenInputComponent, { static: true })
    tokenInput: TokenInputComponent;
    @ViewChild(AddressInputComponent, { static: true })
    addressInput: AddressInputComponent;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: OpenDialogPayload,
        public dialogRef: MatDialogRef<OpenDialogComponent>,
        public raidenService: RaidenService,
        private fb: FormBuilder
    ) {}

    accept() {
        if (this.form.invalid) {
            return;
        }
        const value = this.form.value;
        const result: OpenDialogResult = {
            tokenAddress: value.token,
            partnerAddress: value.address,
            settleTimeout: value.settle_timeout,
            balance: value.amount
        };

        this.dialogRef.close(result);
    }

    tokenNetworkSelected(token: UserToken) {
        this.tokenInput.token = token;
    }
}
