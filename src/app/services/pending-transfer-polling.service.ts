import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { scan, share, switchMap, tap } from 'rxjs/operators';
import { RaidenConfig } from './raiden.config';
import { RaidenService } from './raiden.service';
import { backoff } from '../shared/backoff.operator';
import { NotificationService } from './notification.service';
import { UiMessage } from '../models/notification';
import { PendingTransfer } from '../models/pending-transfer';
import { amountToDecimal } from '../utils/amount.converter';

@Injectable({
    providedIn: 'root'
})
export class PendingTransferPollingService {
    public readonly pendingTransfers$: Observable<PendingTransfer[]>;

    private pendingTransfersSubject: BehaviorSubject<
        void
    > = new BehaviorSubject(null);

    constructor(
        private raidenService: RaidenService,
        private notificationService: NotificationService,
        private raidenConfig: RaidenConfig
    ) {
        let timeout;
        this.pendingTransfers$ = this.pendingTransfersSubject.pipe(
            tap(() => clearTimeout(timeout)),
            switchMap(() => this.raidenService.getPendingTransfers()),
            tap(() => {
                timeout = setTimeout(
                    () => this.refresh(),
                    this.raidenConfig.config.poll_interval
                );
            }),
            scan(
                (
                    oldPendingTransfers: PendingTransfer[],
                    newPendingTransfers: PendingTransfer[]
                ) => {
                    this.checkForNewPendingTransfers(
                        oldPendingTransfers,
                        newPendingTransfers
                    );
                    this.checkForRemovedPendingTransfers(
                        oldPendingTransfers,
                        newPendingTransfers
                    );
                    return newPendingTransfers;
                },
                []
            ),
            backoff(this.raidenConfig.config.error_poll_interval),
            share()
        );

        this.raidenService.paymentInitiated$.subscribe(() => this.refresh());
    }

    public refresh() {
        this.pendingTransfersSubject.next(null);
    }

    private checkForNewPendingTransfers(
        oldPendingTransfers: PendingTransfer[],
        newPendingTransfers: PendingTransfer[]
    ) {
        const pendingTransfers = newPendingTransfers.filter(
            newPendingTransfer => {
                return !oldPendingTransfers.find(oldPendingTransfer =>
                    this.isTheSamePendingTransfer(
                        oldPendingTransfer,
                        newPendingTransfer
                    )
                );
            }
        );
        for (const pendingTransfer of pendingTransfers) {
            let message: UiMessage;
            const token = pendingTransfer.userToken;
            const formattedAmount = amountToDecimal(
                pendingTransfer.locked_amount,
                token.decimals
            ).toFixed();
            if (pendingTransfer.role === 'initiator') {
                message = {
                    title: 'Payment in flight',
                    description: `A payment of ${formattedAmount} ${
                        token.symbol
                    } is being sent to ${pendingTransfer.target}`
                };
            } else {
                message = {
                    title: 'Payment incoming',
                    description: `A payment of ${formattedAmount} ${
                        token.symbol
                    } is incoming from ${pendingTransfer.initiator}`
                };
            }
            pendingTransfer.notificationIdentifier = this.notificationService.addPendingAction(
                message
            );
        }
    }

    private checkForRemovedPendingTransfers(
        oldPendingTransfers: PendingTransfer[],
        newPendingTransfers: PendingTransfer[]
    ) {
        const pendingTransfers = oldPendingTransfers.filter(
            oldPendingTransfer => {
                return !newPendingTransfers.find(newPendingTransfer =>
                    this.isTheSamePendingTransfer(
                        oldPendingTransfer,
                        newPendingTransfer
                    )
                );
            }
        );
        for (const pendingTransfer of pendingTransfers) {
            if (pendingTransfer.notificationIdentifier !== undefined) {
                this.notificationService.removePendingAction(
                    pendingTransfer.notificationIdentifier
                );
            }
        }
    }

    private isTheSamePendingTransfer(
        pendingTransfer1: PendingTransfer,
        pendingTransfer2: PendingTransfer
    ) {
        return (
            pendingTransfer1.channel_identifier.isEqualTo(
                pendingTransfer2.channel_identifier
            ) &&
            pendingTransfer1.token_address === pendingTransfer2.token_address &&
            pendingTransfer1.role === pendingTransfer2.role &&
            pendingTransfer1.transferred_amount.isEqualTo(
                pendingTransfer2.transferred_amount
            )
        );
    }
}
