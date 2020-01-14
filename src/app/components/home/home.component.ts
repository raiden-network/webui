import { Component, OnInit } from '@angular/core';
import {
    PaymentDialogPayload,
    PaymentDialogComponent
} from '../payment-dialog/payment-dialog.component';
import BigNumber from 'bignumber.js';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { RaidenService } from '../../services/raiden.service';
import { UserToken } from '../../models/usertoken';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    token: UserToken;

    constructor(
        private dialog: MatDialog,
        private raidenService: RaidenService
    ) {}

    ngOnInit() {}

    pay() {
        const payload: PaymentDialogPayload = {
            tokenAddress: this.token ? this.token.address : '',
            targetAddress: '',
            amount: new BigNumber(0),
            paymentIdentifier: null
        };

        const dialog = this.dialog.open(PaymentDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap((result?: PaymentDialogPayload) => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.initiatePayment(
                        result.tokenAddress,
                        result.targetAddress,
                        result.amount,
                        result.paymentIdentifier
                    );
                })
            )
            .subscribe();
    }
}
