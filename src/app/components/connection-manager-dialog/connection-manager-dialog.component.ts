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
import BigNumber from 'bignumber.js';

export interface ConnectionManagerDialogPayload {
    tokenAddress: string;
    funds: BigNumber;
    decimals: number;
    join: boolean;
}

@Component({
    selector: 'app-join-dialog',
    templateUrl: './connection-manager-dialog.component.html',
    styleUrls: ['./connection-manager-dialog.component.css']
})
export class ConnectionManagerDialogComponent implements OnInit {
    @ViewChild(TokenInputComponent, { static: true })
    tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: new BigNumber(0)
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ConnectionManagerDialogPayload,
        public dialogRef: MatDialogRef<ConnectionManagerDialogComponent>,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // todo
        // this.tokenInput.decimals = this.data.decimals;
        this.cdRef.detectChanges();
    }

    public allocateFunds() {
        if (this.form.invalid) {
            return;
        }
        const payload: ConnectionManagerDialogPayload = {
            tokenAddress: this.data.tokenAddress,
            funds: this.form.value.amount,
            decimals: this.tokenInput.decimals,
            join: this.data.join
        };
        this.dialogRef.close(payload);
    }
}
