import { Component, Inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TokenInputComponent } from '../token-input/token-input.component';
import { DepositMode } from '../../models/deposit-mode.enum';
import BigNumber from 'bignumber.js';
import { Subject, Observable } from 'rxjs';
import { Channel } from '../../models/channel';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { takeUntil, map } from 'rxjs/operators';

export interface DepositWithdrawDialogPayload {
    readonly channel: Channel;
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
export class DepositWithdrawDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form = this.fb.group({
        amount: ['', Validators.required],
    });
    channel: Channel;
    withdraw = false;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) data: DepositWithdrawDialogPayload,
        private dialogRef: MatDialogRef<DepositWithdrawDialogComponent>,
        private fb: FormBuilder,
        private channelPollingService: ChannelPollingService,
        private tokenPollingService: TokenPollingService
    ) {
        this.channel = data.channel;
        this.withdraw = data.depositMode === DepositMode.WITHDRAW;
    }

    ngOnInit(): void {
        this.tokenInput.selectedToken = this.channel.userToken;
        let maxAmount$: Observable<BigNumber>;

        if (this.withdraw) {
            maxAmount$ = this.channelPollingService
                .getChannelUpdates(this.channel)
                .pipe(map((channel) => channel.balance));
        } else {
            maxAmount$ = this.tokenPollingService
                .getTokenUpdates(this.channel.token_address)
                .pipe(map((token) => token.balance));
        }

        maxAmount$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((maxAmount) => {
                this.tokenInput.maxAmount = maxAmount;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept() {
        const tokenAmount = this.form.value.amount;
        this.dialogRef.close({ tokenAmount });
    }

    cancel() {
        this.dialogRef.close();
    }
}
