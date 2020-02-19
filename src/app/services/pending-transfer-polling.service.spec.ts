import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';

import { PendingTransferPollingService } from './pending-transfer-polling.service';
import { RaidenService } from './raiden.service';
import Spy = jasmine.Spy;
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from './notification.service';
import { PendingTransfer } from '../models/pending-transfer';
import { from, of } from 'rxjs';
import { UserToken } from '../models/usertoken';
import { createPendingTransfer, createToken } from '../../testing/test-data';
import { AddressBookService } from './address-book.service';

describe('PendingTransferPollingService', () => {
    let notificationService: NotificationService;
    let raidenService: RaidenService;
    let getPendingTransfersSpy: Spy;

    const token: UserToken = createToken();

    const pendingTransfer1 = createPendingTransfer({
        role: 'initiator',
        userToken: token
    });
    const pendingTransfer2 = createPendingTransfer({
        role: 'target',
        userToken: token
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                PendingTransferPollingService,
                RaidenService,
                NotificationService,
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider()
            ]
        });
    });

    beforeEach(() => {
        raidenService = TestBed.inject(RaidenService);
        notificationService = TestBed.inject(NotificationService);

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
            const mockAddressBookService = TestBed.inject(AddressBookService);
            mockAddressBookService.get = () => {
                return {
                    [pendingTransfer1.target]: 'Test account 1',
                    [pendingTransfer2.initiator]: 'Test account 2'
                };
            };
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
