import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { amountFromDecimal } from '../../utils/amount.converter';
import BigNumber from 'bignumber.js';
import { TokenPollingService } from '../../services/token-polling.service';
import {
    ConfirmationDialogPayload,
    ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { flatMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html',
    styleUrls: ['./token.component.css']
})
export class TokenComponent implements OnInit {
    @Input() token: UserToken;
    @Input() openChannels: number;
    @Input() selected = false;
    @Input() allNetworksView = false;
    @Input() onMainnet = true;
    @Output() select: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private raidenService: RaidenService,
        private tokenPollingService: TokenPollingService,
        private dialog: MatDialog
    ) {}

    ngOnInit() {}

    mint() {
        const decimals = this.token.decimals;
        const scaleFactor = decimals >= 18 ? 1 : decimals / 18;
        const amount = amountFromDecimal(new BigNumber(0.5), decimals)
            .times(scaleFactor)
            .plus(
                amountFromDecimal(new BigNumber(5000), decimals).times(
                    1 - scaleFactor
                )
            )
            .integerValue();
        this.raidenService
            .mintToken(this.token, this.raidenService.raidenAddress, amount)
            .subscribe(() => this.tokenPollingService.refresh());
    }

    leaveNetwork() {
        const payload: ConfirmationDialogPayload = {
            title: 'Leave Token Network',
            message: `Are you sure that you want to close and settle all channels for token
            <p><strong>${this.token.name} (${this.token.address})</strong>?</p>`
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            data: payload
        });

        dialog
            .afterClosed()
            .pipe(
                flatMap(result => {
                    if (!result) {
                        return EMPTY;
                    }

                    return this.raidenService.leaveTokenNetwork(this.token);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
            });
    }
}
