import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialog,
} from '@angular/material/dialog';
import { UserToken } from '../../models/usertoken';
import BigNumber from 'bignumber.js';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { first, switchMap, map, takeUntil } from 'rxjs/operators';
import { of, Observable, Subject } from 'rxjs';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload,
} from '../confirmation-dialog/confirmation-dialog.component';
import { amountToDecimal } from '../../utils/amount.converter';
import { AddressBookService } from '../../services/address-book.service';
import { TokenInputComponent } from '../token-input/token-input.component';

export interface PaymentDialogPayload {
    readonly token: UserToken;
    readonly targetAddress: string;
    readonly amount: BigNumber;
    readonly paymentIdentifier?: BigNumber;
}

@Component({
    selector: 'app-payment-dialog',
    templateUrl: './payment-dialog.component.html',
    styleUrls: ['./payment-dialog.component.css'],
})
export class PaymentDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) data: PaymentDialogPayload,
        private dialogRef: MatDialogRef<PaymentDialogComponent>,
        private fb: FormBuilder,
        private pendingTransferPollingService: PendingTransferPollingService,
        private dialog: MatDialog,
        private addressBookService: AddressBookService
    ) {
        this.form = this.fb.group({
            target_address: [data.targetAddress, Validators.required],
            amount: ['', Validators.required],
            token: [data.token, Validators.required],
            payment_identifier: '',
        });
    }

    ngOnInit() {
        this.form.controls.token.valueChanges
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token) => {
                this.tokenInput.selectedToken = token;
            });
        this.form.controls.token.updateValueAndValidity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept() {
        const value = this.form.value;
        const paymentIdentifier = value['payment_identifier'];

        const payload: PaymentDialogPayload = {
            token: value['token'],
            targetAddress: value['target_address'],
            amount: value['amount'],
            paymentIdentifier:
                BigNumber.isBigNumber(paymentIdentifier) &&
                !paymentIdentifier.isNaN()
                    ? paymentIdentifier
                    : undefined,
        };

        this.checkPendingPayments(payload).subscribe(
            (result: PaymentDialogPayload) => {
                if (result) {
                    this.dialogRef.close(result);
                }
            }
        );
    }

    cancel() {
        this.dialogRef.close();
    }

    private checkPendingPayments(
        payload: PaymentDialogPayload
    ): Observable<PaymentDialogPayload> {
        return this.pendingTransferPollingService.pendingTransfers$.pipe(
            first(),
            switchMap((pendingTransfers) => {
                const samePendingPayment = pendingTransfers.find(
                    (pendingTransfer) =>
                        pendingTransfer.token_address ===
                            payload.token.address &&
                        pendingTransfer.role === 'initiator' &&
                        pendingTransfer.locked_amount.isEqualTo(
                            payload.amount
                        ) &&
                        pendingTransfer.target === payload.targetAddress &&
                        (payload.paymentIdentifier?.isEqualTo(
                            pendingTransfer.payment_identifier
                        ) ??
                            true)
                );

                if (samePendingPayment) {
                    return this.confirmDuplicatePayment(payload);
                } else {
                    return of(payload);
                }
            })
        );
    }

    private confirmDuplicatePayment(
        payload: PaymentDialogPayload
    ): Observable<PaymentDialogPayload> {
        const token = this.form.value['token'];
        const formattedAmount = amountToDecimal(
            payload.amount,
            token.decimals
        ).toFixed();
        const partner = this.addressBookService.get()[payload.targetAddress];

        const confirmationPayload: ConfirmationDialogPayload = {
            title: 'Retrying Transfer',
            message: `There is already a transfer of ${formattedAmount} ${
                token.symbol
            } being sent to ${partner ? partner + ' ' : ''}${
                payload.targetAddress
            }. Are you sure you want to send the same transfer again?`,
        };
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: confirmationPayload,
        });

        return dialog.afterClosed().pipe(
            map((result) => {
                if (!result) {
                    return null;
                }
                return payload;
            })
        );
    }
}
