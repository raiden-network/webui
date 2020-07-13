import { Injectable } from '@angular/core';
import { RaidenService } from './raiden.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { Observable, zip, interval, of } from 'rxjs';
import { UserToken } from '../models/usertoken';
import {
    switchMap,
    map,
    shareReplay,
    startWith,
    retryWhen,
    switchMapTo,
} from 'rxjs/operators';
import { backoff } from '../shared/backoff.operator';
import { RaidenConfig } from './raiden.config';
import { userDepositAbi } from '../models/userDepositAbi';
import { fromPromise } from 'rxjs/internal-compatibility';
import BigNumber from 'bignumber.js';
import { Contract } from 'web3-eth-contract';
import { tokenabi } from '../models/tokenabi';

@Injectable({
    providedIn: 'root',
})
export class UserDepositService {
    readonly balance$: Observable<BigNumber>;
    readonly servicesToken$: Observable<UserToken>;

    constructor(
        private raidenService: RaidenService,
        private tokenInfoRetriever: TokenInfoRetrieverService,
        private raidenConfig: RaidenConfig
    ) {
        const userDepositContract$ = this.getUserDepositContractObservable();

        this.balance$ = this.getBalanceObservable(userDepositContract$);
        this.servicesToken$ = this.getServicesTokenObservable(
            userDepositContract$
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
