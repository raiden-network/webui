import { Component, Inject, ViewChild, OnDestroy, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    Validators,
    ValidatorFn,
    ValidationErrors,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserToken } from '../../models/usertoken';
import { TokenInputComponent } from '../token-input/token-input.component';
import BigNumber from 'bignumber.js';
import { Animations } from '../../animations/animations';
import { TokenPollingService } from '../../services/token-polling.service';
import { Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

export interface OpenDialogPayload {
    readonly token: UserToken;
    readonly defaultSettleTimeout: number;
    readonly revealTimeout: number;
}

export interface OpenDialogResult {
    readonly token: UserToken;
    readonly partnerAddress: string;
    readonly settleTimeout: number;
    readonly balance: BigNumber;
}

@Component({
    selector: 'app-open-dialog',
    templateUrl: './open-dialog.component.html',
    styleUrls: ['./open-dialog.component.scss'],
    animations: Animations.fallDown,
})
export class OpenDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;
    revealTimeout: number;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) data: OpenDialogPayload,
        private dialogRef: MatDialogRef<OpenDialogComponent>,
        private fb: FormBuilder,
        private tokenPollingService: TokenPollingService
    ) {
        this.revealTimeout = data.revealTimeout;
        this.form = this.fb.group({
            address: ['', Validators.required],
            token: [data.token, Validators.required],
            amount: ['', Validators.required],
            settle_timeout: [
                data.defaultSettleTimeout,
                [
                    this.settleTimeoutValidator(),
                    Validators.min(data.revealTimeout * 2),
                    Validators.required,
                ],
            ],
        });
    }

    ngOnInit() {
        this.form.controls.token.valueChanges
            .pipe(
                tap((token) => (this.tokenInput.selectedToken = token)),
                switchMap((token) =>
                    this.tokenPollingService.getTokenUpdates(
                        token?.address ?? ''
                    )
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((updatedToken) => {
                this.tokenInput.maxAmount = updatedToken?.balance;
            });
        this.form.controls.token.updateValueAndValidity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept() {
        const value = this.form.value;
        const result: OpenDialogResult = {
            token: value.token,
            partnerAddress: value.address,
            settleTimeout: value.settle_timeout,
            balance: value.amount,
        };

        this.dialogRef.close(result);
    }

    cancel() {
        this.dialogRef.close();
    }

    private settleTimeoutValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors => {
            const value = parseInt(control.value, 10);
            if (isNaN(value) || value <= 0) {
                return { invalidAmount: true };
            }
            return undefined;
        };
    }
}
