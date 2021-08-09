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
import {
    combineLatest,
    defer,
    from,
    Observable,
    Subject,
    throwError,
    zip,
} from 'rxjs';
import {
    catchError,
    filter,
    finalize,
    first,
    map,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import { TokenInputComponent } from '../token-input/token-input.component';
import Web3 from 'web3';
import { Animations } from 'app/animations/animations';
import { tokenabi } from 'app/models/tokenabi';
import { NotificationService } from 'app/services/notification.service';
import { amountToDecimal } from 'app/utils/amount.converter';
import { Web3Factory } from 'app/services/web3-factory.service';

export interface AccountDialogPayload {
    readonly asset: UserToken | 'ETH';
}

@Component({
    selector: 'app-account-dialog',
    templateUrl: './account-dialog.component.html',
    styleUrls: ['./account-dialog.component.scss'],
    animations: Animations.fallDown,
})
export class AccountDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;
    token: UserToken;
    balance: BigNumber;
    ethSelected: boolean;
    web3: Web3;
    defaultAccount: string;
    requesting = false;
    accountRequestRejected = false;
    wrongChainID = false;

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
        private userDepositService: UserDepositService,
        private notificationService: NotificationService,
        private web3Factory: Web3Factory
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

        from(this.web3Factory.detectProvider())
            .pipe(
                filter((provider) => !!provider),
                map((provider: any) => this.web3Factory.create(provider)),
                tap((web3) => (this.web3 = web3)),
                switchMap(async (web3) => web3.eth.getAccounts())
            )
            .subscribe((accounts) => {
                if (accounts.length > 0) {
                    this.defaultAccount = accounts[0];
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept() {
        if (this.defaultAccount) {
            this.sendTransaction();
        } else {
            this.connectWallet();
        }
    }

    close() {
        this.dialogRef.close();
    }

    private sendTransaction() {
        const symbol = this.ethSelected ? 'ETH' : this.token.symbol;
        const formattedAmount = amountToDecimal(
            this.form.value.amount,
            this.ethSelected ? 18 : this.token.decimals
        ).toFixed();
        let notificationIdentifier: number;

        defer(async () => {
            this.dialogRef.close();
            notificationIdentifier = this.notificationService.addPendingAction({
                title: `Sending ${symbol} to account`,
                description: `${formattedAmount} ${symbol}`,
                icon: 'deposit',
                userToken: this.token,
            });
            const raidenAddress = this.raidenService.raidenAddress;
            const transferValue = (
                this.form.value.amount as BigNumber
            ).toFixed();

            if (this.ethSelected) {
                return this.web3.eth.sendTransaction({
                    from: this.defaultAccount,
                    to: raidenAddress,
                    value: transferValue,
                });
            } else {
                const tokenContract = new this.web3.eth.Contract(
                    tokenabi,
                    this.token.address
                );
                return tokenContract.methods
                    .transfer(raidenAddress, transferValue)
                    .send({ from: this.defaultAccount });
            }
        })
            .pipe(
                finalize(() =>
                    this.notificationService.removePendingAction(
                        notificationIdentifier
                    )
                )
            )
            .subscribe({
                next: () =>
                    this.notificationService.addSuccessNotification({
                        title: `Sent ${symbol} to account`,
                        description: `${formattedAmount} ${symbol}`,
                        icon: 'deposit',
                        userToken: this.token,
                    }),
                error: (error) =>
                    this.notificationService.addErrorNotification({
                        title: `Send ${symbol} to account failed`,
                        description: error?.message
                            ? error.message
                            : error.toString(),
                        icon: 'error-mark',
                        userToken: this.token,
                    }),
            });
    }

    private connectWallet() {
        const requestAccounts$ = defer(async () =>
            this.web3.eth.requestAccounts()
        ).pipe(
            catchError((error) => {
                this.accountRequestRejected = true;
                return throwError(error);
            })
        );

        defer(() => {
            this.requesting = true;
            this.accountRequestRejected = false;
            this.wrongChainID = false;
            return zip(this.web3.eth.getChainId(), this.raidenService.network$);
        })
            .pipe(
                switchMap(([web3ChainId, network]) => {
                    if (web3ChainId !== network.chainId) {
                        this.wrongChainID = true;
                        throw new Error('Chain ids not matching.');
                    }
                    return requestAccounts$;
                }),
                finalize(() => (this.requesting = false))
            )
            .subscribe({
                next: (accounts) => (this.defaultAccount = accounts[0]),
                error: (error) => console.error(error?.message),
            });
    }
}
