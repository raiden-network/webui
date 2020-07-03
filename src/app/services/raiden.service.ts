import {
    HttpClient,
    HttpRequest,
    HttpEventType,
    HttpEvent,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    from,
    interval,
    Observable,
    of,
    zip,
    BehaviorSubject,
    Subject,
    throwError,
} from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import {
    flatMap,
    map,
    shareReplay,
    startWith,
    switchMap,
    tap,
    toArray,
    finalize,
    filter,
    delay,
    catchError,
    mapTo,
    retryWhen,
    switchMapTo,
} from 'rxjs/operators';
import { Channel } from '../models/channel';
import { Connections } from '../models/connection';
import { PaymentEvent } from '../models/payment-event';
import { UserToken } from '../models/usertoken';
import { amountToDecimal } from '../utils/amount.converter';
import { EnvironmentType } from '../models/enviroment-type.enum';
import { RaidenConfig } from './raiden.config';
import { TokenInfoRetrieverService } from './token-info-retriever.service';
import { environment } from '../../environments/environment';
import { fromWei } from 'web3-utils';
import { Network } from '../utils/network-info';
import { DepositMode } from '../models/deposit-mode.enum';
import { backoff } from '../shared/backoff.operator';
import BigNumber from 'bignumber.js';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import { UiMessage } from '../models/notification';
import { AddressBookService } from './address-book.service';
import { Status } from '../models/status';
import { ContractsInfo } from '../models/contracts-info';

interface PendingChannelsMap {
    [tokenAddress: string]: { [partnerAddress: string]: Channel };
}

@Injectable({
    providedIn: 'root',
})
export class RaidenService {
    private paymentInitiatedSubject: BehaviorSubject<
        void
    > = new BehaviorSubject(null);
    private globalRetrySubject: Subject<void> = new Subject();
    private reconnectedSubject: BehaviorSubject<void> = new BehaviorSubject(
        null
    );
    private rpcConnectedSubject: Subject<void> = new Subject();
    private pendingChannelsSubject = new BehaviorSubject<PendingChannelsMap>(
        {}
    );

    readonly raidenAddress$: Observable<string>;
    readonly balance$: Observable<string>;
    readonly network$: Observable<Network>;
    public readonly paymentInitiated$: Observable<
        void
    > = this.paymentInitiatedSubject.asObservable();
    public readonly globalRetry$: Observable<
        void
    > = this.globalRetrySubject.asObservable();
    public readonly reconnected$: Observable<
        void
    > = this.reconnectedSubject.asObservable();
    public readonly rpcConnected$: Observable<
        void
    > = this.rpcConnectedSubject.asObservable();
    public quickConnectPending: { [tokenAddress: string]: boolean } = {};

    private userTokens: { [address: string]: UserToken | null } = {};
    private pendingChannels: PendingChannelsMap = {};

    constructor(
        private http: HttpClient,
        private raidenConfig: RaidenConfig,
        private tokenInfoRetriever: TokenInfoRetrieverService,
        private notificationService: NotificationService,
        private addressBookService: AddressBookService
    ) {
        this.raidenAddress$ = this.reconnected$.pipe(
            switchMap(() =>
                this.http.get<{ our_address: string }>(
                    `${this.raidenConfig.api}/address`
                )
            ),
            map((data) => (this._raidenAddress = data.our_address)),
            backoff(this.raidenConfig.config.error_poll_interval),
            shareReplay(1)
        );

        const fetchBalance$: Observable<string> = this.raidenAddress$.pipe(
            switchMap((address) =>
                fromPromise(this.raidenConfig.web3.eth.getBalance(address))
            ),
            retryWhen((errors) => errors.pipe(switchMapTo(this.rpcConnected$)))
        );

        this.balance$ = interval(15000).pipe(
            startWith(0),
            switchMapTo(fetchBalance$),
            map((value) => fromWei(value, 'ether')),
            shareReplay({ bufferSize: 1, refCount: true })
        );

        this.network$ = this.raidenConfig.network$;

        this.network$.subscribe((network) => {
            this.userTokens = {};
            if (network.tokenConstants) {
                network.tokenConstants.forEach((tokenInfo) => {
                    this.userTokens[tokenInfo.address] = Object.assign(
                        { balance: new BigNumber(0) },
                        tokenInfo
                    );
                });
            }
        });
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

    public getVersion(): Observable<string> {
        return this.http
            .get<{ version: string }>(`${this.raidenConfig.api}/version`)
            .pipe(map((response) => response.version));
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

    public getTokens(
        refreshConnections: boolean = false
    ): Observable<Array<UserToken>> {
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
            ),
            retryWhen((errors) => errors.pipe(switchMapTo(this.rpcConnected$)))
        );
        const connections$: Observable<Connections | null> = refreshConnections
            ? this.http.get<Connections>(`${this.raidenConfig.api}/connections`)
            : of(null);

        return zip(tokens$, connections$).pipe(
            map(([userTokens, connections]) => {
                Object.keys(userTokens).forEach((address) => {
                    const token = userTokens[address];
                    if (connections) {
                        if (
                            connections[address] &&
                            connections[address].channels
                        ) {
                            connections[address].channels = (<BigNumber>(
                                (<unknown>connections[address].channels)
                            )).toNumber();
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
                `${this.raidenConfig.api}/channels/${tokenAddress}/${partnerAddress}`
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
            total_deposit: balance,
        };
        const token = this.getUserToken(tokenAddress);
        const partnerLabel = this.getContactLabel(partnerAddress);
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const formattedBalance = amountToDecimal(
                    balance,
                    token.decimals
                ).toFixed();
                const message: UiMessage = {
                    title: 'Opening channel',
                    description: `with ${partnerLabel} ${partnerAddress} and ${formattedBalance} ${token.symbol} deposit`,
                    icon: 'channel',
                    identiconAddress: partnerAddress,
                    userToken: token,
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );

                if (!this.pendingChannels[tokenAddress]) {
                    this.pendingChannels[tokenAddress] = {};
                }
                this.pendingChannels[tokenAddress][partnerAddress] = {
                    channel_identifier: new BigNumber(0),
                    state: 'waiting_for_open',
                    total_deposit: new BigNumber(0),
                    total_withdraw: new BigNumber(0),
                    balance: new BigNumber(0),
                    reveal_timeout: 0,
                    settle_timeout: settleTimeout,
                    token_address: tokenAddress,
                    partner_address: partnerAddress,
                    depositPending: true,
                    userToken: token,
                };
                this.pendingChannelsSubject.next(this.pendingChannels);
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
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Open channel failed',
                    description: error,
                    icon: 'error-mark',
                    identiconAddress: partnerAddress,
                    userToken: token,
                });
                return throwError(error);
            }),
            finalize(() => {
                this.notificationService.removePendingAction(
                    notificationIdentifier
                );
                delete this.pendingChannels[tokenAddress][partnerAddress];
                this.pendingChannelsSubject.next(this.pendingChannels);
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
        const token = this.getUserToken(tokenAddress);
        const targetLabel = this.getContactLabel(targetAddress);

        const request = new HttpRequest(
            'POST',
            `${this.raidenConfig.api}/payments/${tokenAddress}/${targetAddress}`,
            { amount, identifier },
            { reportProgress: true }
        );

        return this.http.request(request).pipe(
            flatMap((event: HttpEvent<any>) =>
                event.type === HttpEventType.Sent
                    ? of(event).pipe(
                          delay(500),
                          tap(() => this.paymentInitiatedSubject.next(null))
                      )
                    : of(event)
            ),
            filter(
                (event: HttpEvent<any>) => event.type === HttpEventType.Response
            ),
            tap(() => {
                const formattedAmount = amountToDecimal(
                    amount,
                    token.decimals
                ).toFixed();
                const message: UiMessage = {
                    title: 'Sent transfer',
                    description: `${formattedAmount} ${token.symbol} to ${targetLabel} ${targetAddress}`,
                    icon: 'sent',
                    identiconAddress: targetAddress,
                    userToken: token,
                };
                this.notificationService.addSuccessNotification(message);
            }),
            mapTo(null),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Send transfer failed',
                    description: error,
                    icon: 'error-mark',
                    identiconAddress: targetAddress,
                    userToken: token,
                });
                return throwError(error);
            })
        );
    }

    public getPaymentHistory(
        tokenAddress?: string,
        partnerAddress?: string,
        limit?: number,
        offset?: number
    ): Observable<PaymentEvent[]> {
        let paymentsResource = `${this.raidenConfig.api}/payments`;
        if (tokenAddress) {
            paymentsResource += `/${tokenAddress}`;
            if (partnerAddress) {
                paymentsResource += `/${partnerAddress}`;
            }
        }

        const params: { limit?: string; offset?: string } = {};
        if (limit) {
            params.limit = limit.toString();
        }
        if (offset) {
            params.offset = offset.toString();
        }

        return this.http.get<PaymentEvent[]>(paymentsResource, {
            params: params,
        });
    }

    public modifyDeposit(
        tokenAddress: string,
        partnerAddress: string,
        amount: BigNumber,
        mode: DepositMode
    ): Observable<Channel> {
        let notificationIdentifier: number;
        const token = this.getUserToken(tokenAddress);
        const formattedAmount = amountToDecimal(
            amount,
            token.decimals
        ).toFixed();

        return this.getChannel(tokenAddress, partnerAddress).pipe(
            tap((channel) => {
                const message: UiMessage = {
                    title:
                        mode === DepositMode.WITHDRAW
                            ? 'Withdrawing from channel'
                            : 'Depositing to channel',
                    description: `${formattedAmount} ${token.symbol}`,
                    icon: 'channel',
                    identiconAddress: partnerAddress,
                    userToken: token,
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap((channel) => {
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
                    `${this.raidenConfig.api}/channels/${tokenAddress}/${partnerAddress}`,
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
            tap((response) => {
                const message: UiMessage = {
                    title:
                        mode === DepositMode.WITHDRAW
                            ? 'Withdrew from channel'
                            : 'Deposited to channel',
                    description: `${formattedAmount} ${token.symbol}`,
                    icon: 'channel',
                    identiconAddress: partnerAddress,
                    userToken: token,
                };
                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title:
                        mode === DepositMode.WITHDRAW
                            ? 'Withdraw from channel failed'
                            : 'Deposit to channel failed',
                    description: error,
                    icon: 'error-mark',
                    identiconAddress: partnerAddress,
                    userToken: token,
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

    public closeChannel(
        tokenAddress: string,
        partnerAddress: string
    ): Observable<Channel> {
        let notificationIdentifier: number;
        const token = this.getUserToken(tokenAddress);

        return this.getChannel(tokenAddress, partnerAddress).pipe(
            tap((channel) => {
                const partnerLabel = this.getContactLabel(partnerAddress);
                const message: UiMessage = {
                    title: 'Closing channel',
                    description: `${token.symbol} with ${partnerLabel} ${partnerAddress}`,
                    icon: 'channel',
                    identiconAddress: partnerAddress,
                    userToken: token,
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.patch<Channel>(
                    `${this.raidenConfig.api}/channels/${tokenAddress}/${partnerAddress}`,
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
            tap((response) => {
                const partnerLabel = this.getContactLabel(partnerAddress);
                const message: UiMessage = {
                    title: 'Closed channel',
                    description: `${token.symbol} with ${partnerLabel} ${partnerAddress}`,
                    icon: 'channel',
                    identiconAddress: partnerAddress,
                    userToken: token,
                };
                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Close channel failed',
                    description: error,
                    icon: 'error-mark',
                    identiconAddress: partnerAddress,
                    userToken: token,
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

    public registerToken(tokenAddress: string): Observable<void> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Registering token',
                    description: tokenAddress,
                    icon: 'add',
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
            mapTo(null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Registered token',
                    description: tokenAddress,
                    icon: 'add',
                };
                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Register token failed',
                    description: error,
                    icon: 'error-mark',
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

    public connectTokenNetwork(
        funds: BigNumber,
        tokenAddress: string
    ): Observable<void> {
        let notificationIdentifier: number;
        const token = this.getUserToken(tokenAddress);
        const formattedAmount = amountToDecimal(
            funds,
            token.decimals
        ).toFixed();

        return of(null).pipe(
            tap(() => {
                this.quickConnectPending[tokenAddress] = true;
                const message: UiMessage = {
                    title: 'Quick connect',
                    description: `${formattedAmount} ${token.symbol} funds`,
                    icon: 'thunderbolt',
                    userToken: token,
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.put(
                    `${this.raidenConfig.api}/connections/${tokenAddress}`,
                    {
                        funds,
                    }
                )
            ),
            mapTo(null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Quick connect successful',
                    description: `${formattedAmount} ${token.symbol} funds`,
                    icon: 'thunderbolt',
                    userToken: token,
                };
                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Quick connect failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: token,
                });
                return throwError(error);
            }),
            finalize(() => {
                this.quickConnectPending[tokenAddress] = false;
                this.notificationService.removePendingAction(
                    notificationIdentifier
                );
            })
        );
    }

    public leaveTokenNetwork(userToken: UserToken): Observable<void> {
        let notificationIdentifier: number;

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Leaving token network',
                    description: `${userToken.symbol}`,
                    icon: 'close',
                    userToken: userToken,
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
            mapTo(null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Left token network',
                    description: `${userToken.symbol}`,
                    icon: 'close',
                    userToken: userToken,
                };
                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Leave token network failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: userToken,
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
        const formattedAmount = amountToDecimal(amount, token.decimals);

        return of(null).pipe(
            tap(() => {
                const message: UiMessage = {
                    title: 'Minting',
                    description: `${formattedAmount} ${token.symbol} on-chain`,
                    icon: 'token',
                    userToken: token,
                };
                notificationIdentifier = this.notificationService.addPendingAction(
                    message
                );
            }),
            switchMap(() =>
                this.http.post(
                    `${this.raidenConfig.api}/_testing/tokens/${token.address}/mint`,
                    { to: targetAddress, value: amount }
                )
            ),
            mapTo(null),
            tap(() => {
                const message: UiMessage = {
                    title: 'Minted',
                    description: `${formattedAmount} ${token.symbol} on-chain`,
                    icon: 'token',
                    userToken: token,
                };

                this.notificationService.addSuccessNotification(message);
            }),
            catchError((error) => {
                this.notificationService.addErrorNotification({
                    title: 'Mint failed',
                    description: error,
                    icon: 'error-mark',
                    userToken: token,
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

    public getStatus(): Observable<Status> {
        return this.http.get<Status>(`${this.raidenConfig.api}/status`).pipe(
            map((status) => {
                if (status.blocks_to_sync) {
                    status.blocks_to_sync = (<BigNumber>(
                        (<unknown>status.blocks_to_sync)
                    )).toNumber();
                }
                return status;
            })
        );
    }

    public getPendingChannels(): Observable<Channel[]> {
        return this.pendingChannelsSubject.pipe(
            map((pendingChannelsMap: PendingChannelsMap) => {
                let pendingChannels: Channel[] = [];
                Object.values(pendingChannelsMap).forEach((partnerMap) => {
                    pendingChannels = pendingChannels.concat(
                        Object.values(partnerMap)
                    );
                });
                return pendingChannels;
            })
        );
    }

    public getContractsInfo(): Observable<ContractsInfo> {
        return this.http.get<ContractsInfo>(
            `${this.raidenConfig.api}/contracts`
        );
    }

    public getUserToken(tokenAddress: string): UserToken | null {
        return this.userTokens[tokenAddress];
    }

    public async attemptRpcConnection(showNotification = true) {
        const onResult = (success: boolean) => {
            if (success) {
                if (showNotification) {
                    this.notificationService.addInfoNotification({
                        title: 'JSON RPC',
                        description: 'Connection successful',
                        icon: 'info',
                    });
                }
                this.rpcConnectedSubject.next();
            } else if (showNotification) {
                this.notificationService.addErrorNotification({
                    title: 'JSON RPC',
                    description: 'Connection failure',
                    icon: 'error-mark',
                });
            }
        };

        try {
            const result = await this.raidenConfig.load(environment.configFile);
            onResult(result);
        } catch (e) {
            onResult(false);
        }
    }

    public attemptApiConnection() {
        this.notificationService.apiError.retrying = true;
        this.globalRetrySubject.next(null);
    }

    public shutdownRaiden(): Observable<void> {
        return this.http
            .post(`${this.raidenConfig.api}/shutdown`, {})
            .pipe(mapTo(null));
    }

    public reconnectSuccessful() {
        this.reconnectedSubject.next(null);
    }

    public resolveEnsName(name: string): Observable<string> {
        return fromPromise(this.raidenConfig.web3.eth.ens.getAddress(name));
    }

    private getContactLabel(address: string): string {
        let contactLabel = this.addressBookService.get()[address];
        if (!contactLabel) {
            contactLabel = '';
        }
        return contactLabel;
    }
}
