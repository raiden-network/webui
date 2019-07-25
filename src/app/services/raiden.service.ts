import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, interval, Observable, of, throwError, zip } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import {
    catchError,
    flatMap,
    map,
    share,
    shareReplay,
    startWith,
    switchMap,
    tap,
    toArray
} from 'rxjs/operators';
import { Channel } from '../models/channel';
import { Connections } from '../models/connection';
import { PaymentEvent } from '../models/payment-event';
import { SwapToken } from '../models/swaptoken';
import { UserToken } from '../models/usertoken';
import { amountFromDecimal, amountToDecimal } from '../utils/amount.converter';
import { EnvironmentType } from './enviroment-type.enum';
import { RaidenConfig } from './raiden.config';
import { SharedService } from './shared.service';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { environment } from '../../environments/environment';
import { fromWei } from 'web3-utils';
import { Network } from '../utils/network-info';
import { DepositMode } from '../utils/helpers';

@Injectable({
    providedIn: 'root'
})
export class RaidenService {
    readonly raidenAddress$: Observable<string>;
    readonly balance$: Observable<string>;
    readonly network$: Observable<Network>;
    private userTokens: { [id: string]: UserToken | null } = {};

    constructor(
        private http: HttpClient,
        private raidenConfig: RaidenConfig,
        private sharedService: SharedService,
        private tokenInfoRetriever: TokenInfoRetrieverService
    ) {
        this.raidenAddress$ = this.http
            .get<{ our_address: string }>(`${this.raidenConfig.api}/address`)
            .pipe(
                map(data => (this._raidenAddress = data.our_address)),
                catchError(error => this.handleError(error)),
                shareReplay(1)
            );

        const fetch: () => Observable<string> = () => {
            return this.raidenAddress$.pipe(
                flatMap(address =>
                    fromPromise(this.raidenConfig.web3.eth.getBalance(address))
                )
            );
        };

        this.balance$ = interval(15000).pipe(
            startWith(fetch),
            flatMap(fetch),
            map(value => fromWei(value, 'ether')),
            share()
        );

        this.network$ = this.raidenConfig.network$;
    }

    public get production(): boolean {
        return (
            this.raidenConfig.config.environment_type ===
            EnvironmentType.PRODUCTION
        );
    }

    private _raidenAddress: string;

    public get raidenAddress(): string {
        return this._raidenAddress;
    }

    // noinspection JSMethodCanBeStatic
    get identifier(): number {
        return (
            Math.floor(Date.now() / 1000) * 1000 +
            Math.floor(Math.random() * 1000)
        );
    }

    getBlockNumber(): Observable<number> {
        return fromPromise(this.raidenConfig.web3.eth.getBlockNumber());
    }

    public getChannels(): Observable<Array<Channel>> {
        let tokens$: Observable<any>;
        if (Object.keys(this.userTokens).length === 0) {
            tokens$ = this.getTokens(true);
        } else {
            tokens$ = of(null);
        }

        const fetchChannels = this.http
            .get<Array<Channel>>(`${this.raidenConfig.api}/channels`)
            .pipe(
                flatMap((channels: Array<Channel>) => from(channels)),
                map((channel: Channel) => {
                    channel.userToken = this.getUserToken(
                        channel.token_address
                    );
                    return channel;
                }),
                toArray(),
                catchError(error => this.handleError(error))
            );

        return tokens$.pipe(flatMap(() => fetchChannels));
    }

    public getTokens(refresh: boolean = false): Observable<Array<UserToken>> {
        const tokensUrl = `${this.raidenConfig.api}/tokens`;
        const tokens$: Observable<{
            [address: string]: UserToken;
        }> = zip(
            this.http.get<Array<string>>(tokensUrl),
            this.raidenAddress$
        ).pipe(
            flatMap(([tokenAddresses, raidenAddress]) =>
                fromPromise(
                    this.tokenInfoRetriever.createBatch(
                        tokenAddresses,
                        raidenAddress,
                        this.userTokens
                    )
                )
            )
        );
        const connections$ = refresh
            ? this.http.get<Connections>(`${this.raidenConfig.api}/connections`)
            : of(null);

        return zip(tokens$, connections$).pipe(
            map(([userTokens, connections]) => {
                Object.keys(userTokens).forEach(address => {
                    const token = userTokens[address];
                    if (connections) {
                        token.connected = connections[address];
                    }

                    const cachedToken = this.userTokens[address];
                    if (cachedToken) {
                        this.userTokens[address] = Object.assign(
                            cachedToken,
                            token
                        );
                    } else {
                        this.userTokens[address] = token;
                    }
                });

                return Object.values(this.userTokens);
            })
        );
    }

    public getChannel(
        tokenAddress: string,
        partnerAddress: string
    ): Observable<Channel> {
        return this.http
            .get<Channel>(
                `${
                    this.raidenConfig.api
                }/channels/${tokenAddress}/${partnerAddress}`
            )
            .pipe(catchError(error => this.handleError(error)));
    }

    public openChannel(
        tokenAddress: string,
        partnerAddress: string,
        settleTimeout: number,
        balance: number,
        decimals: number
    ): Observable<Channel> {
        const data = {
            token_address: tokenAddress,
            partner_address: partnerAddress,
            settle_timeout: settleTimeout,
            total_deposit: amountFromDecimal(balance, decimals)
        };
        return this.http
            .put<Channel>(`${this.raidenConfig.api}/channels`, data)
            .pipe(catchError(error => this.handleError(error)));
    }

    public initiatePayment(
        tokenAddress: string,
        targetAddress: string,
        amount: number,
        decimals: number,
        paymentIdentifier?: number
    ): Observable<void> {
        const raidenAmount = amountFromDecimal(amount, decimals);

        return this.http
            .post(
                `${
                    this.raidenConfig.api
                }/payments/${tokenAddress}/${targetAddress}`,
                {
                    amount: raidenAmount,
                    identifier: paymentIdentifier
                        ? paymentIdentifier
                        : this.identifier
                }
            )
            .pipe(
                tap(response => {
                    if (
                        'target_address' in response &&
                        'identifier' in response
                    ) {
                        const formattedAmount = amount
                            .toFixed(decimals)
                            .toString();
                        this.sharedService.success({
                            title: 'Transfer successful',
                            description: `A payment of ${formattedAmount} was successfully sent to the partner ${targetAddress}`
                        });
                    } else {
                        this.sharedService.error({
                            title: 'Payment error',
                            description: JSON.stringify(response)
                        });
                    }
                }),
                map(() => null),
                catchError(error => this.handleError(error))
            );
    }

    public getPaymentHistory(
        tokenAddress: string,
        targetAddress?: string
    ): Observable<PaymentEvent[]> {
        return this.http
            .get<PaymentEvent[]>(
                `${this.raidenConfig.api}/payments/${tokenAddress}`
            )
            .pipe(
                map(events => {
                    if (targetAddress) {
                        return events.filter(
                            event =>
                                event.initiator === targetAddress ||
                                event.target === targetAddress
                        );
                    } else {
                        return events;
                    }
                }),
                catchError(error => this.handleError(error))
            );
    }

    public modifyDeposit(
        tokenAddress: string,
        partnerAddress: string,
        amount: number,
        decimals: number,
        mode: DepositMode
    ): Observable<Channel> {
        const increase = amountFromDecimal(amount, decimals);

        return this.getChannel(tokenAddress, partnerAddress).pipe(
            switchMap(channel => {
                const body: {
                    total_deposit?: number;
                    total_withdraw?: number;
                } = {};
                if (mode === DepositMode.WITHDRAW) {
                    body.total_withdraw = channel.total_withdraw + increase;
                } else {
                    body.total_deposit = channel.total_deposit + increase;
                }

                return this.http.patch<Channel>(
                    `${
                        this.raidenConfig.api
                    }/channels/${tokenAddress}/${partnerAddress}`,
                    body
                );
            }),
            tap(response => {
                const action =
                    mode === DepositMode.WITHDRAW ? 'Withdraw' : 'Deposit';

                if ('balance' in response && 'state' in response) {
                    const balance = amountToDecimal(response.balance, decimals);
                    const formattedBalance = balance
                        .toFixed(decimals)
                        .toString();
                    this.sharedService.info({
                        title: action,
                        description: `The channel ${
                            response.channel_identifier
                        } balance changed to ${formattedBalance}`
                    });
                } else {
                    this.sharedService.error({
                        title: action,
                        description: JSON.stringify(response)
                    });
                }
            }),
            catchError(error => this.handleError(error))
        );
    }

    public closeChannel(
        tokenAddress: string,
        partnerAddress: string
    ): Observable<Channel> {
        return this.http
            .patch<Channel>(
                `${
                    this.raidenConfig.api
                }/channels/${tokenAddress}/${partnerAddress}`,
                { state: 'closed' }
            )
            .pipe(
                tap(response => {
                    const action = 'Close';
                    if ('state' in response && response.state === 'closed') {
                        this.sharedService.info({
                            title: action,
                            description: `The channel ${
                                response.channel_identifier
                            } with partner
                    ${response.partner_address} has been closed successfully`
                        });
                    } else {
                        this.sharedService.error({
                            title: action,
                            description: JSON.stringify(response)
                        });
                    }
                }),
                catchError(error => this.handleError(error))
            );
    }

    public registerToken(tokenAddress: string): Observable<void> {
        return this.http
            .put(`${this.raidenConfig.api}/tokens/${tokenAddress}`, {})
            .pipe(
                map(() => null),
                tap(() => {
                    this.sharedService.success({
                        title: 'Token registered',
                        description: `Your token was successfully registered: ${tokenAddress}`
                    });
                }),
                catchError(error => this.handleError(error))
            );
    }

    public connectTokenNetwork(
        funds: number,
        tokenAddress: string,
        decimals: number,
        join: boolean
    ): Observable<void> {
        return this.http
            .put(`${this.raidenConfig.api}/connections/${tokenAddress}`, {
                funds: amountFromDecimal(funds, decimals)
            })
            .pipe(
                map(() => null),
                tap(() => {
                    const title = join ? 'Joined Token Network' : 'Funds Added';
                    const description = join
                        ? `You have successfully joined the Network of Token ${tokenAddress}`
                        : `You successfully added funds to the Network of Token ${tokenAddress}`;
                    this.sharedService.success({
                        title: title,
                        description: description
                    });
                }),
                catchError(error => this.handleError(error))
            );
    }

    public leaveTokenNetwork(userToken: UserToken): Observable<void> {
        return this.http
            .delete(`${this.raidenConfig.api}/connections/${userToken.address}`)
            .pipe(
                map(() => null),
                tap(() => {
                    const description = `Successfully closed and settled all channels in ${
                        userToken.name
                    } <${userToken.address}> token`;
                    this.sharedService.success({
                        title: 'Left Token Network',
                        description: description
                    });
                }),
                catchError(error => this.handleError(error))
            );
    }

    public swapTokens(swap: SwapToken): Observable<boolean> {
        const data = {
            role: swap.role,
            sending_token: swap.sending_token,
            sending_amount: swap.sending_amount,
            receiving_token: swap.receiving_token,
            receiving_amount: swap.receiving_amount
        };
        return this.http
            .put(
                `${this.raidenConfig.api}/token_swaps/${swap.partner_address}/${
                    swap.identifier
                }`,
                data,
                { observe: 'response' }
            )
            .pipe(
                switchMap(response =>
                    response.ok ? of(true) : throwError(response.toString())
                ),
                catchError(error => this.handleError(error))
            );
    }

    public mintToken(
        token: UserToken,
        targetAddress: string,
        amount: number
    ): Observable<void> {
        return this.http
            .post(
                `${this.raidenConfig.api}/_testing/tokens/${
                    token.address
                }/mint`,
                { to: targetAddress, value: amount },
                { observe: 'response' }
            )
            .pipe(
                map(() => null),
                tap(() => {
                    const decimalValue = amountToDecimal(
                        amount,
                        token.decimals
                    );
                    const description = `${decimalValue} ${
                        token.symbol
                    } have successfully been minted`;
                    this.sharedService.success({
                        title: 'Mint',
                        description
                    });
                }),
                catchError(error => this.handleError(error))
            );
    }

    public getUserToken(tokenAddress: string): UserToken | null {
        return this.userTokens[tokenAddress];
    }

    private handleError(error: Response | Error | any) {
        // In a real world app, you might use a remote logging infrastructure
        let errMsg: string;
        if (error instanceof Response) {
            let body;
            try {
                body = error.json() || '';
            } catch (e) {
                body = error.text();
            }
            const err = body || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else if (
            error instanceof HttpErrorResponse &&
            error.error['errors']
        ) {
            const errors = error.error.errors;

            if (typeof errors === 'string') {
                errMsg = errors;
            } else if (typeof errors === 'object') {
                errMsg = '';

                for (const key in errors) {
                    if (errors.hasOwnProperty(key)) {
                        if (errMsg !== '') {
                            errMsg += '\n';
                        }
                        errMsg += `${key}: ${errors[key]}`;
                    }
                }
            } else {
                errMsg = errors;
            }
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        this.sharedService.error({
            title: 'Raiden Error',
            description:
                typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)
        });
        return throwError(errMsg);
    }

    attemptConnection() {
        const onResult = (success: boolean) => {
            if (success) {
                this.sharedService.info({
                    title: 'JSON RPC Connection',
                    description: 'JSON-RPC connection established successfully'
                });
            } else {
                this.sharedService.error({
                    title: 'JSON RPC Connection',
                    description: 'Could not establish a JSON-RPC connection'
                });
            }
        };

        this.raidenConfig
            .load(environment.configFile)
            .then(onResult)
            .catch(() => onResult(false));
    }

    public resolveEnsName(name: string): Observable<string> {
        return fromPromise(this.raidenConfig.web3.eth.ens.getAddress(name));
    }
}
