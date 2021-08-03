import { Inject, OnDestroy, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserToken } from 'app/models/usertoken';
import { RaidenService } from 'app/services/raiden.service';
import { TokenPollingService } from 'app/services/token-polling.service';
import { UserDepositService } from 'app/services/user-deposit.service';
import { Network } from 'app/utils/network-info';
import BigNumber from 'bignumber.js';
import { combineLatest, Observable, Subject, zip } from 'rxjs';
import {
    filter,
    first,
    map,
    switchMap,
    takeUntil,
} from 'rxjs/operators';
import { TokenInputComponent } from '../token-input/token-input.component';

export interface AccountDialogPayload {
    readonly asset: UserToken | 'ETH';
}

@Component({
    selector: 'app-account-dialog',
    templateUrl: './account-dialog.component.html',
    styleUrls: ['./account-dialog.component.scss'],
})
export class AccountDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;
    token: UserToken;
    balance: BigNumber;
    ethSelected: boolean;

    readonly network$: Observable<Network>;
    readonly faucetLink$: Observable<string>;
    readonly ethBalance$: Observable<string>;
    readonly zeroEthBalance$: Observable<boolean>;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) data: AccountDialogPayload,
        private dialogRef: MatDialogRef<AccountDialogComponent>,
        private raidenService: RaidenService,
        private fb: FormBuilder,
        private tokenPollingService: TokenPollingService,
        private userDepositService: UserDepositService
    ) {
        this.form = this.fb.group({
            asset: [data.asset, Validators.required],
            amount: ['', Validators.required],
        });

        this.ethBalance$ = raidenService.balance$;
        this.zeroEthBalance$ = raidenService.balance$.pipe(
            map((balance) => new BigNumber(balance).isZero())
        );
        this.network$ = raidenService.network$;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
    }

    ngOnInit(): void {
        const servicesToken$ = this.userDepositService.servicesToken$.pipe(
            first()
        );
        combineLatest([this.form.controls.asset.valueChanges, servicesToken$])
            .pipe(
                filter(([asset, servicesToken]) => asset !== 'ETH'),
                switchMap(([selectedToken, servicesToken]) => {
                    if (selectedToken.address === servicesToken.address) {
                        return this.userDepositService.servicesToken$;
                    }
                    return this.tokenPollingService.getTokenUpdates(
                        selectedToken.address
                    );
                }),
                map((token) => token.balance),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((balance) => (this.balance = balance));

        this.form.controls.asset.valueChanges
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((asset: UserToken | 'ETH') => {
                this.tokenInput.selectedToken = asset;
                if (asset === 'ETH') {
                    this.ethSelected = true;
                    this.token = undefined;
                } else {
                    this.ethSelected = false;
                    this.token = asset;
                }
            });
        this.form.controls.asset.updateValueAndValidity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    close() {
        this.dialogRef.close();
    }
}
