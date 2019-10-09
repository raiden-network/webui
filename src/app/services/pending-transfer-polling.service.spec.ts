import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';

import { PendingTransferPollingService } from './pending-transfer-polling.service';
import { RaidenService } from './raiden.service';
import Spy = jasmine.Spy;
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import BigNumber from 'bignumber.js';
import { from } from 'rxjs';

describe('PendingTransferPollingService', () => {
    let notificationService: NotificationService;
    let raidenService: RaidenService;
    let getPendingTransfersSpy: Spy;

    const pendingTransfer1: PendingTransfer = {
        channel_identifier: new BigNumber(255),
        initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
        locked_amount: new BigNumber(119),
        payment_identifier: new BigNumber(1),
        role: 'initiator',
        target: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
        token_address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
        token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
        transferred_amount: new BigNumber(331)
    };

    const pendingTransfer2: PendingTransfer = {
        channel_identifier: new BigNumber(255),
        initiator: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
        locked_amount: new BigNumber(20),
        payment_identifier: new BigNumber(155),
        role: 'target',
        target: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
        token_address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
        token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
        transferred_amount: new BigNumber(3)
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                PendingTransferPollingService,
                RaidenService,
                NotificationService,
                TestProviders.MockRaidenConfigProvider()
            ]
        });
    });

    beforeEach(() => {
        raidenService = TestBed.get(RaidenService);
        notificationService = TestBed.get(NotificationService);

        getPendingTransfersSpy = spyOn(raidenService, 'getPendingTransfers');
        spyOn(notificationService, 'addInfoNotification').and.callFake(
            () => {}
        );
        spyOn(notificationService, 'addPendingAction').and.callFake(() => 1);
        spyOn(notificationService, 'removePendingAction').and.callFake(
            () => {}
        );
    });

    it('should be created', inject(
        [PendingTransferPollingService],
        (service: PendingTransferPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should show a notification if new pending transfers are detected', inject(
        [PendingTransferPollingService],
        (service: PendingTransferPollingService) => {
            getPendingTransfersSpy.and.returnValues(
                from([
                    [],
                    [pendingTransfer1],
                    [pendingTransfer1, pendingTransfer2]
                ])
            );
            service.pendingTransfers$.subscribe();

            expect(notificationService.addPendingAction).toHaveBeenCalledTimes(
                2
            );
            // @ts-ignore
            let payload = notificationService.addPendingAction.calls.first()
                .args[0];
            expect(payload.title).toBe('Payment in flight');
            // @ts-ignore
            payload = notificationService.addPendingAction.calls.mostRecent()
                .args[0];
            expect(payload.title).toBe('Payment incoming');
        }
    ));

    it('should remove the notification for a removed pending transfer', inject(
        [PendingTransferPollingService],
        (service: PendingTransferPollingService) => {
            getPendingTransfersSpy.and.returnValues(
                from([[], [pendingTransfer1], [pendingTransfer2]])
            );
            service.pendingTransfers$.subscribe();

            expect(
                notificationService.removePendingAction
            ).toHaveBeenCalledTimes(1);
            expect(
                notificationService.removePendingAction
            ).toHaveBeenCalledWith(pendingTransfer1.notificationIdentifier);
        }
    ));
});
