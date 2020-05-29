import { TestBed, inject, fakeAsync, tick, flush } from '@angular/core/testing';
import { PaymentHistoryPollingService } from './payment-history-polling.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import Spy = jasmine.Spy;
import { of, from } from 'rxjs';
import { RaidenService } from './raiden.service';
import { TestProviders } from '../../testing/test-providers';
import { NotificationService } from './notification.service';
import { UserToken } from '../models/usertoken';
import { AddressBookService } from './address-book.service';
import { createToken, createPaymentEvent } from '../../testing/test-data';

describe('PaymentHistoryPollingService', () => {
    let getPaymentHistorySpy: Spy;
    let notificationService: NotificationService;

    const paymentEvent = createPaymentEvent('EventPaymentReceivedSuccess');
    const paymentEvent2 = createPaymentEvent('EventPaymentReceivedSuccess');

    const token: UserToken = createToken();

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
            providers: [
                PaymentHistoryPollingService,
                RaidenService,
                TestProviders.MockRaidenConfigProvider(),
                NotificationService,
                TestProviders.AddressBookStubProvider(),
            ],
        });
    });

    beforeEach(() => {
        const raidenService = TestBed.inject(RaidenService);
        getPaymentHistorySpy = spyOn(raidenService, 'getPaymentHistory');
        notificationService = TestBed.inject(NotificationService);
        spyOn(notificationService, 'addInfoNotification');
        spyOn(raidenService, 'getUserToken').and.returnValue(token);
    });

    it('should be created', inject(
        [PaymentHistoryPollingService],
        (service: PaymentHistoryPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should refresh the new payment events every polling interval', inject(
        [PaymentHistoryPollingService],
        fakeAsync((service: PaymentHistoryPollingService) => {
            getPaymentHistorySpy.and.returnValue(of([paymentEvent]));
            service.newPaymentEvents$.subscribe((value) =>
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
            const mockAddressBookService = TestBed.inject(AddressBookService);
            mockAddressBookService.get = () => {
                return {
                    [paymentEvent2.initiator]: 'Test account',
                };
            };
            getPaymentHistorySpy.and.returnValues(
                from([[], [paymentEvent], [paymentEvent2]])
            );
            service.newPaymentEvents$.subscribe();

            expect(
                notificationService.addInfoNotification
            ).toHaveBeenCalledTimes(2);
        }
    ));

    it('should be able to poll the history for a token and a partner', inject(
        [PaymentHistoryPollingService],
        (service: PaymentHistoryPollingService) => {
            getPaymentHistorySpy.and.returnValue(of([paymentEvent]));
            service
                .getHistory(paymentEvent.token_address, paymentEvent.initiator)
                .subscribe((value) => expect(value).toEqual([paymentEvent]));
            expect(getPaymentHistorySpy).toHaveBeenCalledTimes(1);
            expect(getPaymentHistorySpy).toHaveBeenCalledWith(
                paymentEvent.token_address,
                paymentEvent.initiator,
                undefined,
                undefined
            );
        }
    ));
});
