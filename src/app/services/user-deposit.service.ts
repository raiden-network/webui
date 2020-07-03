import { Injectable } from '@angular/core';
import { RaidenService } from './raiden.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { Observable, zip, interval } from 'rxjs';
import { UserToken } from '../models/usertoken';
import {
    switchMap,
    map,
    shareReplay,
    startWith,
    retryWhen,
    switchMapTo,
    tap,
} from 'rxjs/operators';
import { backoff } from '../shared/backoff.operator';
import { RaidenConfig } from './raiden.config';
import { userDepositAbi } from '../models/userDepositAbi';
import { fromPromise } from 'rxjs/internal-compatibility';
import BigNumber from 'bignumber.js';
import { Contract } from 'web3-eth-contract';

@Injectable({
    providedIn: 'root',
})
export class UserDepositService {
    readonly balance$: Observable<BigNumber>;
    readonly servicesToken$: Observable<UserToken>;

    private servicesToken: UserToken;

    constructor(
        private raidenService: RaidenService,
        private tokenInfoRetriever: TokenInfoRetrieverService,
        private raidenConfig: RaidenConfig
    ) {
        const userDepositContract$ = this.raidenService.reconnected$.pipe(
            switchMap(() => this.raidenService.getContractsInfo()),
            map(
                (contracts) =>
                    new this.raidenConfig.web3.eth.Contract(
                        userDepositAbi,
                        contracts.user_deposit_address
                    )
            ),
            backoff(this.raidenConfig.config.error_poll_interval),
            shareReplay(1)
        );

        this.balance$ = this.getBalanceObservable(userDepositContract$);
        this.servicesToken$ = this.getServicesTokenObservable(
            userDepositContract$
        );
    }

    private getBalanceObservable(
        userDepositContract$: Observable<Contract>
    ): Observable<BigNumber> {
        const fetchBalance$ = zip(
            this.raidenService.raidenAddress$,
            userDepositContract$
        ).pipe(
            switchMap(([raidenAddress, contract]) =>
                fromPromise<string>(
                    contract.methods.balances(raidenAddress).call()
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
            switchMap((contract) =>
                fromPromise<string>(contract.methods.token().call())
            ),
            tap(() => {
                this.servicesToken = undefined;
            }),
            retryWhen((errors) =>
                errors.pipe(switchMapTo(this.raidenService.rpcConnected$))
            ),
            shareReplay(1)
        );

        const fetchTokenInfo$ = zip(
            this.raidenService.raidenAddress$,
            servicesTokenAddress$
        ).pipe(
            switchMap(([raidenAddress, tokenAddress]) =>
                fromPromise(
                    this.tokenInfoRetriever.createBatch(
                        [tokenAddress],
                        raidenAddress,
                        { [tokenAddress]: this.servicesToken }
                    )
                )
            ),
            map((result) => Object.values(result)[0]),
            tap((token) => {
                this.servicesToken = token;
            }),
            retryWhen((errors) =>
                errors.pipe(switchMapTo(this.raidenService.rpcConnected$))
            )
        );

        return interval(15000).pipe(
            startWith(0),
            switchMapTo(fetchTokenInfo$),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }
}
