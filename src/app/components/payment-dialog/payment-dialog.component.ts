import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialog
} from '@angular/material/dialog';
import { UserToken } from '../../models/usertoken';
import { IdenticonCacheService } from '../../services/identicon-cache.service';

import { RaidenService } from '../../services/raiden.service';
import { TokenInputComponent } from '../token-input/token-input.component';
import { PaymentIdentifierInputComponent } from '../payment-identifier-input/payment-identifier-input.component';
import BigNumber from 'bignumber.js';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { first, switchMap, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload
} from '../confirmation-dialog/confirmation-dialog.component';
import { amountToDecimal } from '../../utils/amount.converter';
import { transferThresholds } from '../../utils/transfer-thresholds';

export interface PaymentDialogPayload {
    tokenAddress: string;
    targetAddress: string;
    amount: BigNumber;
    decimals: number;
    paymentIdentifier: BigNumber;
}

@Component({
    selector: 'app-payment-dialog',
    templateUrl: './payment-dialog.component.html',
    styleUrls: ['./payment-dialog.component.css']
})
export class PaymentDialogComponent implements OnInit {
    public form: FormGroup;

    @ViewChild(TokenInputComponent, { static: true })
    tokenInput: TokenInputComponent;
    @ViewChild(PaymentIdentifierInputComponent, { static: true })
    paymentIdentifierInput: PaymentIdentifierInputComponent;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: PaymentDialogPayload,
        public dialogRef: MatDialogRef<PaymentDialogComponent>,
        private raidenService: RaidenService,
        private identiconCacheService: IdenticonCacheService,
        private fb: FormBuilder,
        private pendingTransferPollingService: PendingTransferPollingService,
        public dialog: MatDialog
    ) {}

    ngOnInit() {
        const data = this.data;
        this.tokenInput.decimals = data.decimals;

        const raidenAddress = this.raidenService.raidenAddress;

        this.form = this.fb.group({
            target_address: [
                data.targetAddress,
                control =>
                    control.value === raidenAddress
                        ? { ownAddress: true }
                        : undefined
            ],
            amount: new BigNumber(0),
            token: data.tokenAddress,
            payment_identifier: null
        });
    }

    public accept() {
        if (this.form.invalid) {
            return;
        }

        const value = this.form.value;

        const paymentIdentifier = value['payment_identifier'];

        const payload: PaymentDialogPayload = {
            tokenAddress: value['token'],
            targetAddress: value['target_address'],
            decimals: this.tokenInput.tokenAmountDecimals,
            amount: value['amount'],
            paymentIdentifier:
                BigNumber.isBigNumber(paymentIdentifier) &&
                !paymentIdentifier.isNaN()
                    ? paymentIdentifier
                    : undefined
        };

        this.pendingTransferPollingService.pendingTransfers$
            .pipe(
                first(),
                switchMap(pendingTransfers => {
                    const pendingPayment = pendingTransfers.find(
                        pendingTransfer =>
                            pendingTransfer.token_address ===
                                payload.tokenAddress &&
                            pendingTransfer.role === 'initiator' &&
                            pendingTransfer.locked_amount.isEqualTo(
                                payload.amount
                            ) &&
                            pendingTransfer.target === payload.targetAddress &&
                            (payload.paymentIdentifier
                                ? pendingTransfer.payment_identifier.isEqualTo(
                                      payload.paymentIdentifier
                                  )
                                : true)
                    );

                    if (pendingPayment) {
                        const token = this.raidenService.getUserToken(
                            payload.tokenAddress
                        );
                        const formattedAmount = amountToDecimal(
                            payload.amount,
                            payload.decimals
                        ).toFixed();
                        const confirmationPayload: ConfirmationDialogPayload = {
                            title: 'Retrying payment',
                            message:
                                `There is already a payment of <strong>${formattedAmount} ${
                                    token.symbol
                                }</strong> being sent to <strong>${
                                    payload.targetAddress
                                }</strong>. <br/>` +
                                'Are you sure you want to send the same payment again?'
                        };
                        const dialog = this.dialog.open(
                            ConfirmationDialogComponent,
                            {
                                data: confirmationPayload
                            }
                        );

                        return dialog.afterClosed().pipe(
                            map(result => {
                                if (!result) {
                                    return null;
                                }

                                return payload;
                            })
                        );
                    } else {
                        return of(payload);
                    }
                })
            )
            .subscribe(result => {
                if (result) {
                    this.dialogRef.close(result);
                }
            });
    }

    public reset() {
        this.form.reset();
        const targetAddress = this.data.targetAddress;
        const tokenAddress = this.data.tokenAddress;

        this.form.setValue({
            target_address: targetAddress ? targetAddress : '',
            token: tokenAddress || '',
            amount: new BigNumber(0),
            payment_identifier: null
        });

        this.tokenInput.resetAmount();
        this.tokenInput.decimals = this.data.decimals;
        this.paymentIdentifierInput.resetPanel();
    }

    // noinspection JSMethodCanBeStatic
    identicon(address?: string): string {
        if (!address) {
            return '';
        }
        return this.identiconCacheService.getIdenticon(address);
    }

    tokenNetworkSelected(token: UserToken) {
        if (!token) {
            this.tokenInput.decimals = 0;
            this.tokenInput.threshold = undefined;
            return;
        }
        this.tokenInput.decimals = token.decimals;
        this.tokenInput.threshold =
            transferThresholds[token.address.toLowerCase()];
    }
}
