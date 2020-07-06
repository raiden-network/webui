import {
    Component,
    OnInit,
    OnDestroy,
    EventEmitter,
    Output,
} from '@angular/core';
import { Animations } from '../../animations/animations';
import { RaidenService } from '../../services/raiden.service';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, zip, Subject } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Network } from '../../utils/network-info';
import BigNumber from 'bignumber.js';
import { QrCodePayload, QrCodeComponent } from '../qr-code/qr-code.component';
import { MatDialog } from '@angular/material/dialog';
import { MediaObserver } from '@angular/flex-layout';
import { UserDepositService } from '../../services/user-deposit.service';
import { UserToken } from '../../models/usertoken';
import { TokenPollingService } from '../../services/token-polling.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    animations: Animations.easeInOut,
})
export class HeaderComponent implements OnInit, OnDestroy {
    @Output() toggleNotifications: EventEmitter<boolean> = new EventEmitter();
    @Output() toggleMenu: EventEmitter<boolean> = new EventEmitter();

    raidenAddress: string;
    readonly network$: Observable<Network>;
    readonly balance$: Observable<string>;
    readonly zeroBalance$: Observable<boolean>;
    readonly faucetLink$: Observable<string>;
    readonly numberOfNotifications$: Observable<number>;
    readonly udcBalance$: Observable<BigNumber>;
    readonly servicesToken$: Observable<UserToken>;
    readonly zeroUdcBalance$: Observable<boolean>;
    readonly tokens$: Observable<UserToken[]>;

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private dialog: MatDialog,
        private mediaObserver: MediaObserver,
        private userDepositService: UserDepositService,
        private tokenPollingService: TokenPollingService
    ) {
        this.network$ = raidenService.network$;
        this.balance$ = raidenService.balance$;
        this.zeroBalance$ = raidenService.balance$.pipe(
            map((balance) => {
                return new BigNumber(balance).isZero();
            })
        );
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
        this.numberOfNotifications$ = this.notificationService.numberOfNotifications$;
        this.udcBalance$ = this.userDepositService.balance$;
        this.servicesToken$ = this.userDepositService.servicesToken$;
        this.zeroUdcBalance$ = this.userDepositService.balance$.pipe(
            map((balance) => {
                return balance.isZero();
            })
        );
        this.tokens$ = this.tokenPollingService.tokens$.pipe(
            map((tokens) =>
                tokens.filter(
                    (token) => !!token.connected || !token.balance.isZero()
                )
            )
        );
    }

    ngOnInit() {
        this.raidenService.raidenAddress$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((address) => (this.raidenAddress = address));
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
            width: '360px',
        });
    }

    tokenTrackByFn(token: UserToken): string {
        return token.address;
    }
}
