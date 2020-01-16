import { TestBed, inject, fakeAsync, tick, flush } from '@angular/core/testing';
import { PaymentHistoryPollingService } from './payment-history-polling.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import Spy = jasmine.Spy;
import { of, from } from 'rxjs';
import BigNumber from 'bignumber.js';

import { RaidenService } from './raiden.service';
import { TestProviders } from '../../testing/test-providers';
import { PaymentEvent } from '../models/payment-event';
import { NotificationService } from './notification.service';
import { UserToken } from '../models/usertoken';

describe('PaymentHistoryPollingService', () => {
    let getPaymentHistorySpy: Spy;
    let notificationService: NotificationService;

    const paymentEvent: PaymentEvent = {
        event: 'EventPaymentReceivedSuccess',
        amount: new BigNumber(5),
        initiator: '0x82641569b2062B545431cF6D7F0A418582865ba7',
        identifier: new BigNumber(1536847755083),
        log_time: '2019-03-07T18:19:13.976',
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
    };

    const paymentEvent2: PaymentEvent = {
        log_time: '2019-12-23T10:26:18.188000',
        initiator: '0xc52952ebad56f2c5e5b42bb881481ae27d036475',
        identifier: new BigNumber(1577096774214),
        event: 'EventPaymentReceivedSuccess',
        amount: new BigNumber(100000000000000),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED'
    };

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20)
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                PaymentHistoryPollingService,
                RaidenService,
                TestProviders.MockRaidenConfigProvider(),
                NotificationService
            ]
        });
    });

    beforeEach(() => {
        const raidenService = TestBed.get(RaidenService);
        getPaymentHistorySpy = spyOn(raidenService, 'getPaymentHistory');
        notificationService = TestBed.get(NotificationService);
        spyOn(notificationService, 'addSuccessNotification');
        spyOn(raidenService, 'getUserToken').and.returnValue(token);
    });

    it('should be created', inject(
        [PaymentHistoryPollingService],
        (service: PaymentHistoryPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should refresh the payment history every polling interval', inject(
        [PaymentHistoryPollingService],
        fakeAsync((service: PaymentHistoryPollingService) => {
            getPaymentHistorySpy.and.returnValue(of([paymentEvent]));
            service.paymentHistory$.subscribe(value =>
                expect(value).toEqual([paymentEvent])
            );
            const refreshSpy = spyOn(service, 'refresh');
            tick(5000);
            expect(refreshSpy).toHaveBeenCalledTimes(1);
            flush();
        })
    ));

    it('should show a notification if new payment events are detected', inject(
        [PaymentHistoryPollingService],
        (service: PaymentHistoryPollingService) => {
            getPaymentHistorySpy.and.returnValues(
                from([[paymentEvent], [paymentEvent, paymentEvent2]])
            );
            service.paymentHistory$.subscribe();

            expect(
                notificationService.addSuccessNotification
            ).toHaveBeenCalledTimes(1);
            expect(
                notificationService.addSuccessNotification
            ).toHaveBeenCalledWith({
                title: 'Transfer Received',
                description: `A transfer of 1000000 ${
                    token.symbol
                } was received from ${paymentEvent2.initiator}`
            });
        }
    ));
});
