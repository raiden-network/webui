import { Component, OnInit, OnDestroy } from '@angular/core';
import { QrCodeComponent, QrCodePayload } from '../qr-code/qr-code.component';
import { RaidenService } from '../../services/raiden.service';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil, map } from 'rxjs/operators';
import { Subject, Observable, zip } from 'rxjs';
import { Network } from '../../utils/network-info';

@Component({
    selector: 'app-account-actions',
    templateUrl: './account-actions.component.html',
    styleUrls: ['./account-actions.component.css'],
})
export class AccountActionsComponent implements OnInit, OnDestroy {
    raidenAddress: string;
    readonly network$: Observable<Network>;
    readonly faucetLink$: Observable<string>;

    private ngUnsubscribe = new Subject();

    constructor(
        private raidenService: RaidenService,
        private dialog: MatDialog
    ) {
        this.network$ = raidenService.network$;
        this.faucetLink$ = zip(
            raidenService.network$,
            raidenService.raidenAddress$
        ).pipe(
            map(([network, raidenAddress]) =>
                network.faucet.replace('${ADDRESS}', raidenAddress)
            )
        );
    }

    ngOnInit(): void {
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
