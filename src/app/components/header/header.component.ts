import { Component, OnInit, OnDestroy } from '@angular/core';
import { Animations } from '../../animations/animations';
import { RaidenService } from '../../services/raiden.service';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, zip, Subject } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Network } from '../../utils/network-info';
import { MatDialog } from '@angular/material/dialog';
import { QrCodeComponent, QrCodePayload } from '../qr-code/qr-code.component';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    animations: Animations.easeInOut,
})
export class HeaderComponent implements OnInit, OnDestroy {
    raidenAddress: string;
    readonly network$: Observable<Network>;
    readonly balance$: Observable<string>;
    readonly faucetLink$: Observable<string>;
    readonly zeroBalance$: Observable<boolean>;
    readonly numberOfNotifications$: Observable<string>;

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private dialog: MatDialog
    ) {
        this.network$ = raidenService.network$;
        this.balance$ = raidenService.balance$;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
        this.zeroBalance$ = raidenService.balance$.pipe(
            map((balance) => {
                return new BigNumber(balance).isZero();
            })
        );
        this.numberOfNotifications$ = this.notificationService.numberOfNotifications$.pipe(
            map((value) => value.toString())
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

    toggleNotificationSidenav() {
        this.notificationService.toggleSidenav();
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
}
