import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, interval, Observable, of, throwError, zip } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import {
    flatMap,
    map,
    share,
    shareReplay,
    startWith,
    switchMap,
    tap,
    toArray,
    finalize
} from 'rxjs/operators';
import { Channel } from '../models/channel';
import { Connections } from '../models/connection';
import { PaymentEvent } from '../models/payment-event';
import { UserToken } from '../models/usertoken';
import { amountToDecimal } from '../utils/amount.converter';
import { EnvironmentType } from './enviroment-type.enum';
import { RaidenConfig } from './raiden.config';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { environment } from '../../environments/environment';
import { fromWei } from 'web3-utils';
import { Network } from '../utils/network-info';
import { DepositMode } from '../utils/helpers';
import { backoff } from '../shared/backoff.operator';
import BigNumber from 'bignumber.js';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import { UiMessage } from '../models/notification';

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
        private tokenInfoRetriever: TokenInfoRetrieverService,
        private notificationService: NotificationService
    ) {
        this.raidenAddress$ = this.http
            .get<{ our_address: string }>(`${this.raidenConfig.api}/address`)
            .pipe(
                map(data => (this._raidenAddress = data.our_address)),
                backoff(this.raidenConfig.config.error_poll_interval),
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

    public getVersion(): Observable<string> {
        return this.http
            .get<{ version: string }>(`${this.raidenConfig.api}/version`)
            .pipe(map(response => response.version));
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
                    channel.settle_timeout = (<BigNumber>(
                        (<unknown>channel.settle_timeout)
                    )).toNumber();
                    channel.reveal_timeout = (<BigNumber>(
                        (<unknown>channel.reveal_timeout)
                    )).toNumber();
                    channel.userToken = this.getUserToken(
                        channel.token_address
                    );
                    return channel;
                }),
                toArray()
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
                        if (
                            connections[address] &&
                            connections[address].channels
                        ) {
                            connections[address].channels = connections[
                                address
                            ].channels.toNumber();
                        }
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
            .pipe(
                map((channel: Channel) => {
                    channel.settle_timeout = (<BigNumber>(
                        (<unknown>channel.settle_timeout)
                    )).toNumber();
                    channel.reveal_timeout = (<BigNumber>(
                        (<unknown>channel.reveal_timeout)
                    )).toNumber();
                    return channel;
                })
            );
    }

    public openChannel(
        tokenAddress: string,
        partnerAddress: string,
        settleTimeout: number,
        balance: BigNumber
    ): Observable<Channel> {
        const body = {
            token_address: tokenAddress,
            partner_address: partnerAddress,
            settle_timeout: settleTimeout,
            total_deposit: balance
        };
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Opening a channel',
                    description:
                        `A new channel with ${partnerAddress} and a balance of ` +
                        `${balance.toString()} will be opened for the Token ${tokenAddress}`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.put<Channel>(
                    `${this.raidenConfig.api}/channels`,
                    body
                )
            ),
            map((channel: Channel) => {
                channel.settle_timeout = (<BigNumber>(
                    (<unknown>channel.settle_timeout)
                )).toNumber();
                channel.reveal_timeout = (<BigNumber>(
                    (<unknown>channel.reveal_timeout)
                )).toNumber();
                return channel;
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public initiatePayment(
        tokenAddress: string,
        targetAddress: string,
        amount: BigNumber,
        paymentIdentifier?: BigNumber
    ): Observable<void> {
        const identifier = paymentIdentifier
            ? paymentIdentifier
            : this.identifier;

        return this.http
            .post(
                `${
                    this.raidenConfig.api
                }/payments/${tokenAddress}/${targetAddress}`,
                { amount, identifier }
            )
            .pipe(
                tap(() => {
                    const message: UiMessage = {
                        title: 'Transfer successful',
                        description: `A payment of ${amount.toString()} was successfully sent to the partner ${targetAddress}`
                    };
                    this.notificationService.addSuccessNotification(message);
                }),
                map(() => null)
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
                })
            );
    }

    public modifyDeposit(
        tokenAddress: string,
        partnerAddress: string,
        amount: BigNumber,
        mode: DepositMode
    ): Observable<Channel> {
        let notificationIdentifier: number;
        const action = mode === DepositMode.WITHDRAW ? 'Withdraw' : 'Deposit';

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: action,
                    description:
                        `The balance for the channel with ${partnerAddress} ` +
                        `for the token ${tokenAddress} will be changed to ${amount.toString()}`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() => this.getChannel(tokenAddress, partnerAddress)),
            switchMap(channel => {
                const body: {
                    total_deposit?: BigNumber;
                    total_withdraw?: BigNumber;
                } = {};
                if (mode === DepositMode.WITHDRAW) {
                    body.total_withdraw = channel.total_withdraw.plus(amount);
                } else {
                    body.total_deposit = channel.total_deposit.plus(amount);
                }

                return this.http.patch<Channel>(
                    `${
                        this.raidenConfig.api
                    }/channels/${tokenAddress}/${partnerAddress}`,
                    body
                );
            }),
            map((channel: Channel) => {
                channel.settle_timeout = (<BigNumber>(
                    (<unknown>channel.settle_timeout)
                )).toNumber();
                channel.reveal_timeout = (<BigNumber>(
                    (<unknown>channel.reveal_timeout)
                )).toNumber();
                return channel;
            }),
            tap(response => {
                const message: UiMessage = {
                    title: action,
                    description: `The channel ${
                        response.channel_identifier
                    } balance changed to ${response.balance.toString()}`
                };

                this.notificationService.addInfoNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public closeChannel(
        tokenAddress: string,
        partnerAddress: string
    ): Observable<Channel> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Closing a channel',
                    description: `The channel with ${partnerAddress} for the Token ${tokenAddress} will be closed`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.patch<Channel>(
                    `${
                        this.raidenConfig.api
                    }/channels/${tokenAddress}/${partnerAddress}`,
                    { state: 'closed' }
                )
            ),
            map((channel: Channel) => {
                channel.settle_timeout = (<BigNumber>(
                    (<unknown>channel.settle_timeout)
                )).toNumber();
                channel.reveal_timeout = (<BigNumber>(
                    (<unknown>channel.reveal_timeout)
                )).toNumber();
                return channel;
            }),
            tap(response => {
                const message: UiMessage = {
                    title: 'Close',
                    description: `The channel ${
                        response.channel_identifier
                    } with partner ${
                        response.partner_address
                    } has been closed successfully`
                };
                this.notificationService.addInfoNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public registerToken(tokenAddress: string): Observable<void> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Registering token',
                    description: `The token ${tokenAddress} will be registered`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.put(
                    `${this.raidenConfig.api}/tokens/${tokenAddress}`,
                    {}
                )
            ),
            map(() => null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Token registered',
                    description: `Your token was successfully registered: ${tokenAddress}`
                };
                this.notificationService.addSuccessNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public connectTokenNetwork(
        funds: BigNumber,
        tokenAddress: string,
        join: boolean
    ): Observable<void> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: join ? 'Joining Token Network' : 'Adding Funds',
                    description: join
                        ? `You are joining the Network of Token ${tokenAddress}`
                        : `You are adding funds to the Network of Token ${tokenAddress}`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.put(
                    `${this.raidenConfig.api}/connections/${tokenAddress}`,
                    {
                        funds
                    }
                )
            ),
            map(() => null),
            tap(() => {
                const message: UiMessage = {
                    title: join ? 'Joined Token Network' : 'Funds Added',
                    description: join
                        ? `You have successfully joined the Network of Token ${tokenAddress}`
                        : `You successfully added funds to the Network of Token ${tokenAddress}`
                };
                this.notificationService.addSuccessNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public leaveTokenNetwork(userToken: UserToken): Observable<void> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Leaving Token Network',
                    description: `All channels for ${userToken.name} <${
                        userToken.address
                    }> token will be closed and settled`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.delete(
                    `${this.raidenConfig.api}/connections/${userToken.address}`
                )
            ),
            map(() => null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Left Token Network',
                    description: `Successfully closed and settled all channels in ${
                        userToken.name
                    } <${userToken.address}> token`
                };
                this.notificationService.addSuccessNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public getPendingTransfers(): Observable<PendingTransfer[]> {
        return this.http.get<PendingTransfer[]>(
            `${this.raidenConfig.api}/pending_transfers`
        );
    }

    public mintToken(
        token: UserToken,
        targetAddress: string,
        amount: BigNumber
    ): Observable<void> {
        let notificationIdentifier: number;
        const decimalValue = amountToDecimal(amount, token.decimals);

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Minting Token',
                    description: `${decimalValue} ${
                        token.symbol
                    } will be minted`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.post(
                    `${this.raidenConfig.api}/_testing/tokens/${
                        token.address
                    }/mint`,
                    { to: targetAddress, value: amount }
                )
            ),
            map(() => null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Mint',
                    description: `${decimalValue} ${
                        token.symbol
                    } have successfully been minted`
                };

                this.notificationService.addSuccessNotification(message);
            }),
            finalize(() =>
                this.notificationService.removePendingAction(
                    notificationIdentifier
                )
            )
        );
    }

    public getUserToken(tokenAddress: string): UserToken | null {
        return this.userTokens[tokenAddress];
    }

    attemptConnection() {
        const onResult = (success: boolean) => {
            if (success) {
                this.notificationService.addInfoNotification({
                    title: 'JSON RPC Connection',
                    description: 'JSON-RPC connection established successfully'
                });
            } else {
                this.notificationService.addErrorNotification({
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
