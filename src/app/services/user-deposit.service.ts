import { Injectable } from '@angular/core';
import { RaidenService } from './raiden.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { Observable, zip, interval, of, throwError } from 'rxjs';
import { UserToken } from '../models/usertoken';
import {
    switchMap,
    map,
    shareReplay,
    startWith,
    retryWhen,
    switchMapTo,
    tap,
    catchError,
    finalize,
    first,
} from 'rxjs/operators';
import { backoff } from '../shared/backoff.operator';
import { RaidenConfig } from './raiden.config';
import { userDepositAbi } from '../models/userDepositAbi';
import { fromPromise } from 'rxjs/internal-compatibility';
import BigNumber from 'bignumber.js';
import { Contract } from 'web3-eth-contract';
import { tokenabi } from '../models/tokenabi';
import { NotificationService } from './notification.service';
import { amountToDecimal } from 'app/utils/amount.converter';

@Injectable({
    providedIn: 'root',
})
export class UserDepositService {
    readonly balance$: Observable<BigNumber>;
    readonly servicesToken$: Observable<UserToken>;

    private readonly userDepositContract$: Observable<Contract>;

    constructor(
        private raidenService: RaidenService,
        private tokenInfoRetriever: TokenInfoRetrieverService,
        private raidenConfig: RaidenConfig,
        private notificationService: NotificationService
    ) {
        this.userDepositContract$ = this.getUserDepositContractObservable();
        this.balance$ = this.getBalanceObservable(this.userDepositContract$);
        this.servicesToken$ = this.getServicesTokenObservable(
            this.userDepositContract$
        );
    }

    deposit(amount: BigNumber): Observable<void> {
        const totalDeposit$ = zip(
            this.raidenService.raidenAddress$,
            this.userDepositContract$
        ).pipe(
            first(),
            switchMap(([raidenAddress, userDepositContract]) =>
                fromPromise<string>(
                    userDepositContract.methods
                        .total_deposit(raidenAddress)
                        .call()
                )
            ),
            map((value) => new BigNumber(value))
        );

        let servicesToken: UserToken;
        let formattedAmount: string;
        let notificationIdentifier: number;

        return this.servicesToken$.pipe(
            first(),
            tap((token) => {
                servicesToken = token;
                formattedAmount = amountToDecimal(
                    amount,
                    servicesToken.decimals
                ).toFixed();
                notificationIdentifier = this.notificationService.addPendingAction(
                    {
                        title: 'Depositing to UDC',
                        description: `${formattedAmount} ${servicesToken.symbol}`,
                        icon: 'deposit',
                        userToken: servicesToken,
                    }
                );
            }),
            switchMapTo(totalDeposit$),
            switchMap((totalDeposit) => {
                const newTotalDeposit = totalDeposit.plus(amount);
                return this.raidenService.setUdcDeposit(newTotalDeposit);
            }),
            tap(() => {
                this.notificationService.addSuccessNotification({
                    title: 'Deposited to UDC',
                    description: `${formattedAmount} ${servicesToken.symbol}`,
                    icon: 'deposit',
                    userToken: servicesToken,
                });
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Deposit to UDC failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: servicesToken,
                });
                return throwError(error);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    planWithdraw(amount: BigNumber): Observable<void> {
        let servicesToken: UserToken;
        let formattedAmount: string;
        let notificationIdentifier: number;

        return this.servicesToken$.pipe(
            first(),
            tap((token) => {
                servicesToken = token;
                formattedAmount = amountToDecimal(
                    amount,
                    servicesToken.decimals
                ).toFixed();
                notificationIdentifier = this.notificationService.addPendingAction(
                    {
                        title: 'Planning withdraw from UDC',
                        description: `${formattedAmount} ${servicesToken.symbol}`,
                        icon: 'withdraw',
                        userToken: servicesToken,
                    }
                );
            }),
            switchMap(() => this.raidenService.planUdcWithdraw(amount)),
            tap(() => {
                this.notificationService.addSuccessNotification({
                    title: 'Planned withdraw from UDC',
                    description: `${formattedAmount} ${servicesToken.symbol}`,
                    icon: 'withdraw',
                    userToken: servicesToken,
                });
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Plan withdraw from UDC failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: servicesToken,
                });
                return throwError(error);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    withdraw(amount: BigNumber): Observable<void> {
        let servicesToken: UserToken;
        let formattedAmount: string;
        let notificationIdentifier: number;

        return this.servicesToken$.pipe(
            first(),
            tap((token) => {
                servicesToken = token;
                formattedAmount = amountToDecimal(
                    amount,
                    servicesToken.decimals
                ).toFixed();
                notificationIdentifier = this.notificationService.addPendingAction(
                    {
                        title: 'Withdrawing from UDC',
                        description: `${formattedAmount} ${servicesToken.symbol}`,
                        icon: 'withdraw',
                        userToken: servicesToken,
                    }
                );
            }),
            switchMap(() => this.raidenService.withdrawFromUdc(amount)),
            tap(() => {
                this.notificationService.addSuccessNotification({
                    title: 'Withdrew from UDC',
                    description: `${formattedAmount} ${servicesToken.symbol}`,
                    icon: 'withdraw',
                    userToken: servicesToken,
                });
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Withdraw from UDC failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: servicesToken,
                });
                return throwError(error);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    private getUserDepositContractObservable(): Observable<Contract> {
        return this.raidenService.reconnected$.pipe(
            switchMap(() => this.raidenService.getContractsInfo()),
            backoff(this.raidenConfig.config.error_poll_interval),
            map(
                (contractsInfo) =>
                    new this.raidenConfig.web3.eth.Contract(
                        userDepositAbi,
                        contractsInfo.user_deposit_address
                    )
            ),
            shareReplay(1)
        );
    }

    private getBalanceObservable(
        userDepositContract$: Observable<Contract>
    ): Observable<BigNumber> {
        const fetchBalance$ = zip(
            this.raidenService.raidenAddress$,
            userDepositContract$
        ).pipe(
            switchMap(([raidenAddress, userDepositContract]) =>
                fromPromise<string>(
                    userDepositContract.methods.balances(raidenAddress).call()
                )
            ),
            map((value) => new BigNumber(value)),
            retryWhen((errors) =>
                errors.pipe(switchMapTo(this.raidenService.rpcConnected$))
            )
        );

        return interval(15000).pipe(
            startWith(0),
            switchMapTo(fetchBalance$),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    private getServicesTokenObservable(
        userDepositContract$: Observable<Contract>
    ): Observable<UserToken> {
        const servicesTokenAddress$ = userDepositContract$.pipe(
            switchMap((userDepositContract) =>
                fromPromise<string>(userDepositContract.methods.token().call())
            )
        );

        const servicesTokenInfo$ = zip(
            this.raidenService.raidenAddress$,
            servicesTokenAddress$
        ).pipe(
            switchMap(([raidenAddress, tokenAddress]) =>
                fromPromise(
                    this.tokenInfoRetriever.createBatch(
                        [tokenAddress],
                        raidenAddress
                    )
                )
            ),
            map((result) => Object.values(result)[0]),
            retryWhen((errors) =>
                errors.pipe(switchMapTo(this.raidenService.rpcConnected$))
            ),
            shareReplay(1)
        );

        const fetchTokenBalance$ = zip(
            this.raidenService.raidenAddress$,
            servicesTokenInfo$
        ).pipe(
            switchMap(([raidenAddress, servicesTokenInfo]) => {
                const tokenContract = new this.raidenConfig.web3.eth.Contract(
                    tokenabi,
                    servicesTokenInfo.address
                );
                return zip(
                    of(servicesTokenInfo),
                    fromPromise<string>(
                        tokenContract.methods.balanceOf(raidenAddress).call()
                    )
                );
            }),
            map(([servicesTokenInfo, balance]) => {
                servicesTokenInfo.balance = new BigNumber(balance);
                return servicesTokenInfo;
            }),
            retryWhen((errors) =>
                errors.pipe(switchMapTo(this.raidenService.rpcConnected$))
            )
        );

        return interval(15000).pipe(
            startWith(0),
            switchMapTo(fetchTokenBalance$),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }
}
