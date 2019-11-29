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
    private pendingChannels: {
        [tokenAddress: string]: { [partnerAddress: string]: boolean | null };
    } = {};

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

        const fetchChannels$ = this.http
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
                    if (
                        this.pendingChannels[channel.token_address] &&
                        this.pendingChannels[channel.token_address][
                            channel.partner_address
                        ]
                    ) {
                        channel.depositPending = true;
                    } else {
                        channel.depositPending = false;
                    }
                    return channel;
                }),
                toArray()
            );

        return tokens$.pipe(flatMap(() => fetchChannels$));
    }

    public getTokens(refresh: boolean = false): Observable<Array<UserToken>> {
        const tokens$: Observable<{
            [address: string]: UserToken;
        }> = zip(
            this.http.get<Array<string>>(`${this.raidenConfig.api}/tokens`),
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
                const token = this.getUserToken(tokenAddress);
                const formattedBalance = amountToDecimal(
                    balance,
                    token.decimals
                ).toFixed();
                const message: UiMessage = {
                    title: 'Opening a channel',
                    description: `A new channel with ${partnerAddress} and a balance of ${formattedBalance} ${
                        token.symbol
                    } will be opened in ${token.name} network`
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );

                if (!this.pendingChannels[tokenAddress]) {
                    this.pendingChannels[tokenAddress] = {};
                }
                this.pendingChannels[tokenAddress][partnerAddress] = true;
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
            finalize(() => {
                this.notificationService.removePendingAction(
                    notificationIdentifier
                );
                delete this.pendingChannels[tokenAddress][partnerAddress];
            })
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
                    const token = this.getUserToken(tokenAddress);
                    const formattedAmount = amountToDecimal(
                        amount,
                        token.decimals
                    ).toFixed();
                    const message: UiMessage = {
                        title: 'Transfer successful',
                        description: `A payment of ${formattedAmount} ${
                            token.symbol
                        } was successfully sent to ${targetAddress}`
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
        const token = this.getUserToken(tokenAddress);
        const formattedAmount = amountToDecimal(
            amount,
            token.decimals
        ).toFixed();

        return this.getChannel(tokenAddress, partnerAddress).pipe(
            tap(channel => {
                let description;
                if (mode === DepositMode.WITHDRAW) {
                    description = `${formattedAmount} ${
                        token.symbol
                    } will be withdrawn from channel ${
                        channel.channel_identifier
                    } with ${partnerAddress}`;
                } else {
                    description = `${formattedAmount} ${
                        token.symbol
                    } will be deposited to channel ${
                        channel.channel_identifier
                    } with ${partnerAddress}`;
                }

                const message: UiMessage = {
                    title: action,
                    description: description
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
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
                let description;
                if (mode === DepositMode.WITHDRAW) {
                    description = `${formattedAmount} ${
                        token.symbol
                    } were withdrawn from channel ${
                        response.channel_identifier
                    } with ${partnerAddress}`;
                } else {
                    description = `${formattedAmount} ${
                        token.symbol
                    } were deposited to channel ${
                        response.channel_identifier
                    } with ${partnerAddress}`;
                }

                const message: UiMessage = {
                    title: action,
                    description: description
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
        const token = this.getUserToken(tokenAddress);

        return this.getChannel(tokenAddress, partnerAddress).pipe(
            tap(channel => {
                const message: UiMessage = {
                    title: 'Closing a channel',
                    description: `Channel ${
                        channel.channel_identifier
                    } with ${partnerAddress} in ${
                        token.name
                    } network will be closed`
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
                    description: `Channel ${response.channel_identifier} with ${
                        response.partner_address
                    } in ${token.name} network was closed successfully`
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
                    description: `Token ${tokenAddress} will be registered`
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
                    description: `Token ${tokenAddress} was successfully registered`
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
        const token = this.getUserToken(tokenAddress);
        const formattedAmount = amountToDecimal(
            funds,
            token.decimals
        ).toFixed();

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: join ? 'Joining token network' : 'Adding funds',
                    description: join
                        ? `${
                              token.name
                          } network will be joined with ${formattedAmount} ${
                              token.symbol
                          }`
                        : `Funds for ${
                              token.name
                          } network will be changed to ${formattedAmount} ${
                              token.symbol
                          }`
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
                    title: join ? 'Joined token network' : 'Funds added',
                    description: join
                        ? `${
                              token.name
                          } network was joined successfully with ${formattedAmount} ${
                              token.symbol
                          }`
                        : `Funds for ${
                              token.name
                          } network were successfully changed to ${formattedAmount} ${
                              token.symbol
                          }`
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
                    title: 'Leaving token network',
                    description: `All channels in ${
                        userToken.name
                    } network will be closed and settled`
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
                    title: 'Left token network',
                    description: `Successfully closed and settled all channels in ${
                        userToken.name
                    } network`
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
        let tokens$: Observable<any>;
        if (Object.keys(this.userTokens).length === 0) {
            tokens$ = this.getTokens(true);
        } else {
            tokens$ = of(null);
        }

        const fetchPendingTransfers$ = this.http
            .get<PendingTransfer[]>(
                `${this.raidenConfig.api}/pending_transfers`
            )
            .pipe(
                flatMap((pendingTransfers: PendingTransfer[]) =>
                    from(pendingTransfers)
                ),
                map((pendingTransfer: PendingTransfer) => {
                    // Quickfix for https://github.com/raiden-network/raiden/issues/5411
                    // Can be removed when fixed in client
                    if (
                        typeof pendingTransfer.channel_identifier === 'string'
                    ) {
                        // @ts-ignore
                        pendingTransfer.channel_identifier = new BigNumber(
                            pendingTransfer.channel_identifier
                        );
                    }
                    if (typeof pendingTransfer.locked_amount === 'string') {
                        // @ts-ignore
                        pendingTransfer.locked_amount = new BigNumber(
                            pendingTransfer.locked_amount
                        );
                    }
                    if (
                        typeof pendingTransfer.payment_identifier === 'string'
                    ) {
                        // @ts-ignore
                        pendingTransfer.payment_identifier = new BigNumber(
                            pendingTransfer.payment_identifier
                        );
                    }
                    if (
                        typeof pendingTransfer.transferred_amount === 'string'
                    ) {
                        // @ts-ignore
                        pendingTransfer.transferred_amount = new BigNumber(
                            pendingTransfer.transferred_amount
                        );
                    }

                    pendingTransfer.userToken = this.getUserToken(
                        pendingTransfer.token_address
                    );
                    return pendingTransfer;
                }),
                toArray()
            );

        return tokens$.pipe(flatMap(() => fetchPendingTransfers$));
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
                    } were successfully minted`
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
