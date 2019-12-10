import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';

import { PendingTransferPollingService } from './pending-transfer-polling.service';
import { RaidenService } from './raiden.service';
import Spy = jasmine.Spy;
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import BigNumber from 'bignumber.js';
import { from, of } from 'rxjs';
import { UserToken } from '../models/usertoken';

describe('PendingTransferPollingService', () => {
    let notificationService: NotificationService;
    let raidenService: RaidenService;
    let getPendingTransfersSpy: Spy;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        balance: new BigNumber(20),
        decimals: 8
    };

    const pendingTransfer1: PendingTransfer = {
        channel_identifier: new BigNumber(255),
        initiator: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
        locked_amount: new BigNumber(119),
        payment_identifier: new BigNumber(1),
        role: 'initiator',
        target: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
        transferred_amount: new BigNumber(331),
        userToken: token
    };

    const pendingTransfer2: PendingTransfer = {
        channel_identifier: new BigNumber(255),
        initiator: '0x00AF5cBfc8dC76cd599aF623E60F763228906F3E',
        locked_amount: new BigNumber(20),
        payment_identifier: new BigNumber(155),
        role: 'target',
        target: '0x5E1a3601538f94c9e6D2B40F7589030ac5885FE7',
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        token_network_address: '0x111157460c0F41EfD9107239B7864c062aA8B978',
        transferred_amount: new BigNumber(3),
        userToken: token
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
        spyOn(notificationService, 'addInfoNotification');
        spyOn(notificationService, 'addPendingAction').and.callFake(() => 1);
        spyOn(notificationService, 'removePendingAction');
        pendingTransfer1.notificationIdentifier = undefined;
        pendingTransfer2.notificationIdentifier = undefined;
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
            expect(payload.description).toBe(
                `A payment of 0.00000119 ${token.symbol} is being sent to ${
                    pendingTransfer1.target
                }`
            );
            // @ts-ignore
            payload = notificationService.addPendingAction.calls.mostRecent()
                .args[0];
            expect(payload.title).toBe('Payment incoming');
            expect(payload.description).toBe(
                `A payment of 0.0000002 ${token.symbol} is incoming from ${
                    pendingTransfer2.initiator
                }`
            );
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

    it('should keep the notification identifier on same pending transfers', inject(
        [PendingTransferPollingService],
        (service: PendingTransferPollingService) => {
            const pendingTransfer1Clone: PendingTransfer = Object.assign(
                {},
                pendingTransfer1
            );
            getPendingTransfersSpy.and.returnValues(
                from([[], [pendingTransfer1], [pendingTransfer1Clone]])
            );
            let notificationIdentifier: number;
            let emittedTimes = 0;
            service.pendingTransfers$
                .subscribe((pendingTransfers: PendingTransfer[]) => {
                    if (emittedTimes === 1) {
                        notificationIdentifier =
                            pendingTransfers[0].notificationIdentifier;
                    } else if (emittedTimes === 2) {
                        expect(pendingTransfers[0].notificationIdentifier).toBe(
                            notificationIdentifier
                        );
                    }
                    emittedTimes++;
                })
                .add(() => {
                    expect(
                        notificationService.removePendingAction
                    ).toHaveBeenCalledTimes(0);
                });
        }
    ));

    it('should refresh the pending transfers every polling interval', inject(
        [PendingTransferPollingService],
        fakeAsync((service: PendingTransferPollingService) => {
            getPendingTransfersSpy.and.returnValue(of([pendingTransfer1]));
            service.pendingTransfers$.subscribe();
            const refreshSpy = spyOn(service, 'refresh');
            tick(5000);
            expect(refreshSpy).toHaveBeenCalledTimes(1);
            flush();
        })
    ));
});
