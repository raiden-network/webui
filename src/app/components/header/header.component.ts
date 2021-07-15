import {
    Component,
    OnInit,
    OnDestroy,
    EventEmitter,
    Output,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Animations } from '../../animations/animations';
import { RaidenService } from '../../services/raiden.service';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { Observable, zip, Subject, combineLatest } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Network } from '../../utils/network-info';
import BigNumber from 'bignumber.js';
import { QrCodePayload, QrCodeComponent } from '../qr-code/qr-code.component';
import { MatDialog } from '@angular/material/dialog';
import { MediaObserver } from '@angular/flex-layout';
import { UserDepositService } from '../../services/user-deposit.service';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';
import { SharedService } from '../../services/shared.service';
import { SelectedTokenService } from 'app/services/selected-token.service';
import { UserDepositDialogComponent } from '../user-deposit-dialog/user-deposit-dialog.component';
import { getMintAmount } from 'app/shared/mint-amount';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    animations: Animations.stretchInOut,
})
export class HeaderComponent implements OnInit, OnDestroy {
    @Output() toggleNotifications: EventEmitter<boolean> = new EventEmitter();
    @Output() toggleMenu: EventEmitter<boolean> = new EventEmitter();

    @ViewChild('token_balances_list', { static: false })
    private tokenBalancesElement: ElementRef;

    raidenAddress: string;
    readonly network$: Observable<Network>;
    readonly balance$: Observable<string>;
    readonly zeroBalance$: Observable<boolean>;
    readonly numberOfNotifications$: Observable<number>;
    readonly udcBalance$: Observable<BigNumber>;
    readonly servicesToken$: Observable<UserToken>;
    readonly zeroUdcBalance$: Observable<boolean>;
    readonly tokens$: Observable<UserToken[]>;
    readonly onMainnet$: Observable<boolean>;
    readonly udcWithdrawPlanned$: Observable<boolean>;
    tokenBalancesOpen = false;
    mintPending: { [tokenAddress: string]: boolean } = {};

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private dialog: MatDialog,
        private mediaObserver: MediaObserver,
        private userDepositService: UserDepositService,
        private tokenPollingService: TokenPollingService,
        private sharedService: SharedService,
        private selectedTokenService: SelectedTokenService
    ) {
        this.network$ = raidenService.network$;
        this.balance$ = raidenService.balance$;
        this.zeroBalance$ = raidenService.balance$.pipe(
            map((balance) => new BigNumber(balance).isZero())
        );
        this.numberOfNotifications$ =
            this.notificationService.numberOfNotifications$;
        this.udcBalance$ = this.userDepositService.balance$;
        this.servicesToken$ = this.userDepositService.servicesToken$;
        this.zeroUdcBalance$ = this.userDepositService.balance$.pipe(
            map((balance) => balance.isZero())
        );
        this.tokens$ = combineLatest([
            this.tokenPollingService.tokens$,
            this.selectedTokenService.selectedToken$,
        ]).pipe(
            map(([tokens, selectedToken]) => {
                const filteredTokens = tokens.filter(
                    (token) =>
                        (!!token.connected || !token.balance.isZero()) &&
                        (!selectedToken ||
                            token.address !== selectedToken.address)
                );
                if (selectedToken) {
                    filteredTokens.unshift(selectedToken);
                }
                return filteredTokens;
            })
        );
        this.onMainnet$ = raidenService.network$.pipe(
            map((network) => network.chainId === 1)
        );
        this.udcWithdrawPlanned$ = this.userDepositService.withdrawPlan$.pipe(
            map((withdrawPlan) => withdrawPlan.amount.isGreaterThan(0))
        );
    }

    ngOnInit() {
        this.raidenService.raidenAddress$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((address) => (this.raidenAddress = address));

        this.sharedService.globalClickTarget$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((target) => {
                if (
                    this.tokenBalancesElement &&
                    !this.tokenBalancesElement.nativeElement.contains(target)
                ) {
                    this.tokenBalancesOpen = false;
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('lt-lg');
    }

    showOwnAddressQrCode() {
        const payload: QrCodePayload = {
            content: this.raidenAddress,
        };
        this.dialog.open(QrCodeComponent, {
            data: payload,
            width: '550px',
        });
    }

    tokenTrackByFn(token: UserToken): string {
        return token.address;
    }

    mint(token: UserToken) {
        this.mintPending[token.address] = true;
        const amount = getMintAmount(token.decimals);
        this.raidenService
            .mintToken(token, amount)
            .pipe(finalize(() => (this.mintPending[token.address] = false)))
            .subscribe(() => this.tokenPollingService.refresh());
    }

    openUdcDialog() {
        this.dialog.open(UserDepositDialogComponent, {
            width: '509px',
        });
    }

    pendingUdcTransaction(): boolean {
        return (
            this.userDepositService.depositPending ||
            this.userDepositService.planWithdrawPending ||
            this.userDepositService.withdrawPending
        );
    }
}
