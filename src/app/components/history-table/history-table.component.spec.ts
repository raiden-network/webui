import {
    waitForAsync,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush,
} from '@angular/core/testing';
import { HistoryTableComponent, HistoryEvent } from './history-table.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestProviders } from '../../../testing/test-providers';
import { SelectedTokenService } from '../../services/selected-token.service';
import { PaymentHistoryPollingService } from '../../services/payment-history-polling.service';
import {
    createToken,
    createTestPaymentEvents,
    createPaymentEvent,
    createPendingTransfer,
} from '../../../testing/test-data';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { BehaviorSubject, of } from 'rxjs';
import { PaymentEvent } from '../../models/payment-event';
import { stub } from '../../../testing/stub';
import { SharedService } from '../../services/shared.service';
import { AddressBookService } from '../../services/address-book.service';
import { Contacts } from '../../models/contact';
import { ClipboardModule } from 'ngx-clipboard';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { PendingTransfer } from '../../models/pending-transfer';
import { By } from '@angular/platform-browser';
import { clickElement } from '../../../testing/interaction-helper';
import { RaidenService } from '../../services/raiden.service';

describe('HistoryTableComponent', () => {
    let component: HistoryTableComponent;
    let fixture: ComponentFixture<HistoryTableComponent>;

    const token1 = createToken();
    const token2 = createToken({ symbol: 'TST2', name: 'Test Suite Token 2' });
    const history = createTestPaymentEvents(3, token1).concat(
        createTestPaymentEvents(3, token2)
    );
    const pendingTransfer1 = createPendingTransfer({
        role: 'initiator',
    });
    const pendingTransfer2 = createPendingTransfer({
        role: 'target',
    });
    const pendingTransfers = [pendingTransfer1, pendingTransfer2];
    let historySubject: BehaviorSubject<PaymentEvent[]>;
    let pendingTransfersSubject: BehaviorSubject<PendingTransfer[]>;

    function pendingTransferToHistoryEvent(
        pendingTransfer: PendingTransfer
    ): HistoryEvent {
        const initiator = pendingTransfer.role === 'initiator';
        const event: HistoryEvent = {
            target: pendingTransfer.target,
            initiator: pendingTransfer.initiator,
            event: initiator
                ? 'EventPaymentSentSuccess'
                : 'EventPaymentReceivedSuccess',
            amount: pendingTransfer.locked_amount,
            identifier: pendingTransfer.payment_identifier,
            log_time: '',
            token_address: pendingTransfer.token_address,
            pending: true,
        };
        return event;
    }

    beforeEach(
        waitForAsync(() => {
            const pendingTransferPollingMock = stub<
                PendingTransferPollingService
            >();
            pendingTransfersSubject = new BehaviorSubject(pendingTransfers);
            // @ts-ignore
            pendingTransferPollingMock.pendingTransfers$ = pendingTransfersSubject.asObservable();

            TestBed.configureTestingModule({
                declarations: [
                    HistoryTableComponent,
                    DecimalPipe,
                    DisplayDecimalsPipe,
                ],
                providers: [
                    TestProviders.AddressBookStubProvider(),
                    SelectedTokenService,
                    PaymentHistoryPollingService,
                    SharedService,
                    TestProviders.MockRaidenConfigProvider(),
                    {
                        provide: PendingTransferPollingService,
                        useValue: pendingTransferPollingMock,
                    },
                    RaidenService,
                ],
                imports: [
                    MaterialComponentsModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                    HttpClientTestingModule,
                    ClipboardModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryTableComponent);
        component = fixture.componentInstance;

        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getUserToken').and.callFake(
            (tokenAddress) =>
                ({ [token1.address]: token1, [token2.address]: token2 }[
                    tokenAddress
                ])
        );

        historySubject = new BehaviorSubject(history);
        const paymentHistoryPollingService = TestBed.inject(
            PaymentHistoryPollingService
        );
        spyOn(paymentHistoryPollingService, 'getHistory').and.callFake(() =>
            historySubject.asObservable()
        );
    });

    describe('not showing complete history', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.destroy();
        });

        it('should only display 4 events', () => {
            expect(component.visibleHistory.length).toBe(4);
        });

        it('should show failed payment events', () => {
            const errorEvent = createPaymentEvent('EventPaymentSentFailed');
            historySubject.next([errorEvent]);
            pendingTransfersSubject.next([]);
            fixture.detectChanges();
            expect(component.visibleHistory).toEqual([errorEvent]);
        });

        it('should show pending transfers in the history', () => {
            expect(component.visibleHistory[0]).toEqual(
                pendingTransferToHistoryEvent(pendingTransfer2)
            );
            expect(component.visibleHistory[1]).toEqual(
                pendingTransferToHistoryEvent(pendingTransfer1)
            );
        });

        it('should filter the events by the selected token', () => {
            const selectedTokenService = TestBed.inject(SelectedTokenService);
            selectedTokenService.setToken(token1);
            fixture.detectChanges();

            for (const event of component.visibleHistory) {
                expect(event.token_address).toBe(token1.address);
            }
        });

        it('should filter the events by a token symbol search filter', fakeAsync(() => {
            const sharedService = TestBed.inject(SharedService);
            sharedService.setSearchValue(token2.symbol);
            tick(1000);
            fixture.detectChanges();

            for (const event of component.visibleHistory) {
                expect(event.token_address).toBe(token2.address);
            }
            flush();
        }));

        it('should filter the events by a contact label search filter', fakeAsync(() => {
            const event = createPaymentEvent('EventPaymentSentSuccess');
            historySubject.next([event].concat(history));
            const addressBookService = TestBed.inject(AddressBookService);
            addressBookService.get = () => {
                const contacts: Contacts = {
                    [event.target]: 'The test target',
                };
                return contacts;
            };
            fixture.detectChanges();

            const sharedService: SharedService = TestBed.inject(SharedService);
            sharedService.setSearchValue('The test target');
            tick(1000);
            fixture.detectChanges();

            expect(component.visibleHistory.length).toBe(1);
            expect(component.visibleHistory[0]).toEqual(event);
            flush();
        }));

        it('should filter the events by a contact address search filter', fakeAsync(() => {
            const event = createPaymentEvent('EventPaymentSentSuccess');
            historySubject.next([event].concat(history));
            const addressBookService = TestBed.inject(AddressBookService);
            addressBookService.get = () => {
                const contacts: Contacts = {
                    [event.target]: 'The test target',
                };
                return contacts;
            };
            fixture.detectChanges();

            const sharedService: SharedService = TestBed.inject(SharedService);
            sharedService.setSearchValue(event.target);
            tick(1000);
            fixture.detectChanges();

            expect(component.visibleHistory.length).toBe(1);
            expect(component.visibleHistory[0]).toEqual(event);
            flush();
        }));

        it('should show all events link', () => {
            const link = fixture.debugElement.query(By.css('.label__link'));
            expect(link).toBeTruthy();
        });

        it('should not show pagination buttons', () => {
            const next = fixture.debugElement.query(By.css('#next'));
            const previous = fixture.debugElement.query(By.css('#previous'));
            expect(next).toBeFalsy();
            expect(previous).toBeFalsy();
        });
    });

    describe('showing complete history', () => {
        beforeEach(() => {
            component.showAll = true;
            fixture.detectChanges();
        });

        it('should display events in pages', () => {
            expect(component.numberOfPages).toBe(Math.ceil(history.length / 4));
            expect(component.visibleHistory.length).toBe(4);
        });

        it('should go to the next page when button clicked', () => {
            clickElement(fixture.debugElement, '#next');
            fixture.detectChanges();
            expect(component.currentPage).toBe(1);
        });

        it('should go to the previous page when button clicked', () => {
            component.currentPage = 2;
            fixture.detectChanges();
            clickElement(fixture.debugElement, '#previous');
            fixture.detectChanges();
            expect(component.currentPage).toBe(1);
        });

        it('should not go to the next page when on last page', () => {
            component.currentPage = component.numberOfPages - 1;
            fixture.detectChanges();
            component.nextPage();
            expect(component.currentPage).toBe(component.numberOfPages - 1);
        });

        it('should not go to the previous page when on first page', () => {
            component.previousPage();
            expect(component.currentPage).toBe(0);
        });

        it('should not show all events link', () => {
            const link = fixture.debugElement.query(By.css('.label__link'));
            expect(link).toBeFalsy();
        });
    });
});
