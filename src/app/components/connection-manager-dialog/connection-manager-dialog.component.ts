import { Component, Inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TokenInputComponent } from '../token-input/token-input.component';
import BigNumber from 'bignumber.js';
import { UserToken } from '../../models/usertoken';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TokenPollingService } from '../../services/token-polling.service';

export interface ConnectionManagerDialogPayload {
    token: UserToken;
    funds: BigNumber;
}

@Component({
    selector: 'app-join-dialog',
    templateUrl: './connection-manager-dialog.component.html',
    styleUrls: ['./connection-manager-dialog.component.scss'],
})
export class ConnectionManagerDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: ['', Validators.required],
        token: [undefined, Validators.required],
    });
    initiatedWithoutToken = false;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: ConnectionManagerDialogPayload,
        private dialogRef: MatDialogRef<ConnectionManagerDialogComponent>,
        private fb: FormBuilder,
        private tokenPollingService: TokenPollingService
    ) {
        this.initiatedWithoutToken = !data.token;
    }

    ngOnInit() {
        if (this.data.token) {
            this.tokenNetworkSelected(this.data.token);
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    tokenNetworkSelected(token: UserToken) {
        this.form.get('token').setValue(token);
        this.tokenInput.selectedToken = token;
        this.subscribeToTokenUpdates(token.address);
    }

    subscribeToTokenUpdates(tokenAddress: string) {
        this.ngUnsubscribe.next();
        this.tokenPollingService
            .getTokenUpdates(tokenAddress)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((updatedToken: UserToken) => {
                this.tokenInput.maxAmount = updatedToken.balance;
            });
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
