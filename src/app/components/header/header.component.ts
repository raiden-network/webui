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

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    animations: Animations.easeInOut,
})
export class HeaderComponent implements OnInit, OnDestroy {
    @Output() toggleNotifications: EventEmitter<boolean> = new EventEmitter();

    raidenAddress: string;
    readonly network$: Observable<Network>;
    readonly balance$: Observable<string>;
    readonly zeroBalance$: Observable<boolean>;
    readonly faucetLink$: Observable<string>;
    readonly numberOfNotifications$: Observable<number>;

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private dialog: MatDialog
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
