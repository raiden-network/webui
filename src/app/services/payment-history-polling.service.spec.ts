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

    const receivedEvent = createPaymentEvent('EventPaymentReceivedSuccess');
    const receivedEvent2 = createPaymentEvent('EventPaymentReceivedSuccess');
    const sentEvent = createPaymentEvent('EventPaymentSentSuccess');
    const sentEvent2 = createPaymentEvent('EventPaymentSentSuccess', {
        token_address: sentEvent.token_address,
        target: sentEvent.target,
    });

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
            getPaymentHistorySpy.and.returnValue(of([receivedEvent]));
            service.newPaymentEvents$.subscribe((value) =>
                expect(value).toEqual([receivedEvent])
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
                    [receivedEvent2.initiator]: 'Test account',
                };
            };
            getPaymentHistorySpy.and.returnValues(
                from([[], [receivedEvent], [receivedEvent2]])
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
            getPaymentHistorySpy.and.returnValue(of([receivedEvent]));
            service
                .getHistory(
                    receivedEvent.token_address,
                    receivedEvent.initiator
                )
                .subscribe((value) => expect(value).toEqual([receivedEvent]));
            expect(getPaymentHistorySpy).toHaveBeenCalledTimes(1);
            expect(getPaymentHistorySpy).toHaveBeenCalledWith(
                receivedEvent.token_address,
                receivedEvent.initiator,
                undefined,
                undefined
            );
        }
    ));

    it('should store usage information about tokens and payment targets', inject(
        [PaymentHistoryPollingService],
        (service: PaymentHistoryPollingService) => {
            getPaymentHistorySpy.and.returnValue(of([sentEvent, sentEvent2]));
            service.newPaymentEvents$.subscribe();
            expect(service.getTokenUsage(sentEvent.token_address)).toBe(2);
            expect(service.getPaymentTargetUsage(sentEvent.target)).toBe(2);
        }
    ));
});
