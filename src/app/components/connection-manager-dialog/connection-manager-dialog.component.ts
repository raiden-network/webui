import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { TokenInputComponent } from '../token-input/token-input.component';

export interface ConnectionManagerDialogPayload {
    tokenAddress: string;
    funds: number;
    decimals: number;
}

@Component({
    selector: 'app-join-dialog',
    templateUrl: './connection-manager-dialog.component.html',
    styleUrls: ['./connection-manager-dialog.component.css']
})
export class ConnectionManagerDialogComponent implements OnInit {

    @ViewChild(TokenInputComponent) tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: 0
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ConnectionManagerDialogPayload,
        public dialogRef: MatDialogRef<ConnectionManagerDialogComponent>,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef,
    ) {
    }

    ngOnInit(): void {
        this.tokenInput.decimals = this.data.decimals;
        this.cdRef.detectChanges();
    }

    public joinTokenNetwork() {
        const payload: ConnectionManagerDialogPayload = {
            tokenAddress: this.data.tokenAddress,
            funds: this.tokenInput.tokenAmount.toNumber(),
            decimals: this.tokenInput.tokenAmountDecimals
        };
        this.dialogRef.close(payload);
    }
}
