import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryTableComponent } from './history-table.component';
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
    createPaymentEvent
} from '../../../testing/test-data';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { BehaviorSubject } from 'rxjs';
import { PaymentEvent } from '../../models/payment-event';
import { stub } from '../../../testing/stub';

describe('HistoryTableComponent', () => {
    let component: HistoryTableComponent;
    let fixture: ComponentFixture<HistoryTableComponent>;

    const token1 = createToken();
    const token2 = createToken({ symbol: 'TST2', name: 'Test Suite Token 2' });
    const history = createTestPaymentEvents(3, token1).concat(
        createTestPaymentEvents(3, token2)
    );
    let historySubject: BehaviorSubject<PaymentEvent[]>;

    beforeEach(async(() => {
        const historyPollingMock = stub<PaymentHistoryPollingService>();
        historySubject = new BehaviorSubject(history);
        // @ts-ignore
        historyPollingMock.paymentHistory$ = historySubject.asObservable();

        TestBed.configureTestingModule({
            declarations: [
                HistoryTableComponent,
                DecimalPipe,
                DisplayDecimalsPipe
            ],
            providers: [
                TestProviders.AddressBookStubProvider(),
                TestProviders.HammerJSProvider(),
                SelectedTokenService,
                {
                    provide: PaymentHistoryPollingService,
                    useValue: historyPollingMock
                }
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should only display 4 events', () => {
        expect(component.history.length).toBe(4);
    });

    it('should not show failed payment events', () => {
        const errorEvent = createPaymentEvent('EventPaymentSentFailed');
        historySubject.next([errorEvent]);
        fixture.detectChanges();
        expect(component.history.length).toBe(0);
    });

    it('should filter the events by the selected token', () => {
        const selectedTokenService: SelectedTokenService = TestBed.get(
            SelectedTokenService
        );
        selectedTokenService.setToken(token1);
        fixture.detectChanges();

        for (let i = 0; i < component.history.length; i++) {
            expect(component.history[i].token_address).toBe(token1.address);
        }
    });
});
