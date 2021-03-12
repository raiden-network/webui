import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DepositMode } from 'app/models/deposit-mode.enum';
import { UserToken } from 'app/models/usertoken';
import { RaidenService } from 'app/services/raiden.service';
import {
    UserDepositService,
    WithdrawPlan,
} from 'app/services/user-deposit.service';
import { getMintAmount } from 'app/shared/mint-amount';
import BigNumber from 'bignumber.js';
import { Observable, Subject } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-user-deposit-dialog',
    templateUrl: './user-deposit-dialog.component.html',
    styleUrls: ['./user-deposit-dialog.component.scss'],
})
export class UserDepositDialogComponent implements OnInit, OnDestroy {
    readonly balance$: Observable<BigNumber>;
    readonly zeroBalance$: Observable<boolean>;
    readonly blocksUntilWithdraw$: Observable<number>;
    readonly onMainnet$: Observable<boolean>;
    servicesToken: UserToken;
    withdrawPlan: WithdrawPlan;
    inputActive = false;
    inputMode: DepositMode;
    mintPending = false;

    private ngUnsubscribe = new Subject();

    constructor(
        private dialogRef: MatDialogRef<UserDepositDialogComponent>,
        private userDepositService: UserDepositService,
        private raidenService: RaidenService
    ) {
        this.balance$ = this.userDepositService.balance$;
        this.zeroBalance$ = this.userDepositService.balance$.pipe(
            map((balance) => balance.isZero())
        );
        this.blocksUntilWithdraw$ = this.userDepositService.blocksUntilWithdraw$;
        this.onMainnet$ = this.raidenService.network$.pipe(
            map((network) => network.chainId === 1)
        );
    }

    get depositPending(): boolean {
        return this.userDepositService.depositPending;
    }

    get planWithdrawPending(): boolean {
        return this.userDepositService.planWithdrawPending;
    }

    get withdrawPending(): boolean {
        return this.userDepositService.withdrawPending;
    }

    ngOnInit(): void {
        this.userDepositService.withdrawPlan$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((withdrawPlan) => {
                this.withdrawPlan = withdrawPlan;
            });
        this.userDepositService.servicesToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((servicesToken) => {
                this.servicesToken = servicesToken;
            });

        this.userDepositService.refreshWithdrawPlan();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    close() {
        this.dialogRef.close();
    }

    showDepositInput() {
        this.inputMode = DepositMode.DEPOSIT;
        this.inputActive = true;
    }

    showPlanWithdrawInput() {
        this.inputMode = DepositMode.WITHDRAW;
        this.inputActive = true;
    }

    hideInput() {
        this.inputMode = undefined;
        this.inputActive = false;
    }

    acceptForm(value: BigNumber) {
        const inputMode = this.inputMode;
        this.hideInput();
        if (inputMode === DepositMode.DEPOSIT) {
            this.deposit(value);
        } else {
            this.planWithdraw(value);
        }
    }

    mint() {
        this.mintPending = true;
        const amount = getMintAmount(this.servicesToken.decimals);
        this.raidenService
            .mintToken(this.servicesToken, amount)
            .pipe(finalize(() => (this.mintPending = false)))
            .subscribe();
    }

    deposit(amount: BigNumber) {
        this.userDepositService.deposit(amount).subscribe();
    }

    planWithdraw(amount: BigNumber) {
        this.userDepositService.planWithdraw(amount).subscribe();
    }

    withdraw() {
        this.userDepositService.withdraw(this.withdrawPlan.amount).subscribe();
    }
}
