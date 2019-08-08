import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import {
    async,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { PaymentEvent } from '../../models/payment-event';
import { UserToken } from '../../models/usertoken';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { TokenPipe } from '../../pipes/token.pipe';
import { RaidenService } from '../../services/raiden.service';
import { SharedService } from '../../services/shared.service';

import { PaymentHistoryComponent } from './payment-history.component';
import { TestProviders } from '../../../testing/test-providers';
import { PageBaseComponent } from '../page/page-base/page-base.component';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import BigNumber from 'bignumber.js';

describe('PaymentHistoryComponent', () => {
    let component: PaymentHistoryComponent;
    let fixture: ComponentFixture<PaymentHistoryComponent>;
    let spy: jasmine.Spy;

    let dataProvider: BehaviorSubject<PaymentEvent[]>;

    const connectedToken: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20),
        connected: {
            channels: new BigNumber(5),
            funds: new BigNumber(10),
            sum_deposits: new BigNumber(50)
        }
    };

    const mockData: PaymentEvent[] = [
        {
            event: 'EventPaymentSendFailed',
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            reason: 'insufficient funds',
            identifier: new BigNumber(1536847754083),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentReceivedSuccess',
            amount: new BigNumber(5),
            initiator: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847755083),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(35),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847756083),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(20),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847757083),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentReceivedSuccess',
            amount: new BigNumber(5),
            initiator: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847758103),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(11),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847759000),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(1),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847760030),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(4),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847760130),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentReceivedSuccess',
            amount: new BigNumber(8),
            initiator: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847760230),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSentSuccess',
            amount: new BigNumber(2),
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847760330),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentReceivedSuccess',
            amount: new BigNumber(5),
            initiator: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            identifier: new BigNumber(1536847760430),
            log_time: '2019-03-07T18:19:13.976'
        },
        {
            event: 'EventPaymentSendFailed',
            target: '0x82641569b2062B545431cF6D7F0A418582865ba7',
            reason: 'insufficient funds',
            identifier: new BigNumber(1536847760442),
            log_time: '2019-03-07T18:19:13.976'
        }
    ];

    function getVisibleItems(): DebugElement[] {
        const historyList = fixture.debugElement.query(By.css('.page-list'));
        return historyList.queryAll(By.directive(PageItemComponent));
    }

    const tokenNetwork = '0x0f114A1E9Db192502E7856309cc899952b3db1ED';
    const partnerAddress = '0xc52952Ebad56f2c5E5b42bb881481Ae27D036475';

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                PaymentHistoryComponent,
                PageBaseComponent,
                PageItemComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                TokenPipe
            ],
            providers: [
                SharedService,
                TestProviders.HammerJSProvider(),
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParamMap: new BehaviorSubject(
                            convertToParamMap({
                                token_address: tokenNetwork,
                                partner_address: partnerAddress
                            })
                        )
                    }
                },
                RaidenService
            ],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        dataProvider = new BehaviorSubject([]);
        const raidenService = TestBed.get(RaidenService);
        spy = spyOn(raidenService, 'getPaymentHistory');
        spy.and.returnValue(dataProvider);

        const tokenSpy = spyOn(raidenService, 'getUserToken');
        tokenSpy.and.returnValue(connectedToken);
        fixture = TestBed.createComponent(PaymentHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', fakeAsync(() => {
        tick();
        expect(component).toBeTruthy();
        flush();
    }));

    function noPaymentElement() {
        const elements = fixture.debugElement.queryAll(By.css('h2'));
        const label = 'No payments found!';
        return elements.filter(
            value =>
                (value.nativeElement as HTMLHeadingElement).textContent ===
                label
        );
    }

    it('should display a no payments found message if there is no response', fakeAsync(() => {
        tick();
        fixture.detectChanges();
        expect(noPaymentElement().length).toBe(1);
        flush();
    }));

    it('should display the first page of payments when opening', fakeAsync(() => {
        dataProvider.next(mockData);
        tick();

        fixture.detectChanges();
        expect(noPaymentElement().length).toBe(
            0,
            'Should not show the no payment message'
        );

        const cards = getVisibleItems();
        expect(cards.length).toBe(
            component.pageSize,
            'Should display a full page'
        );

        const id: string = cards[0].properties['id'];
        expect(id).toBe('payment-event-0');
        component.ngOnDestroy();
        flush();
    }));

    it('should change page when user clicks next', fakeAsync(() => {
        dataProvider.next(mockData);
        tick();

        fixture.detectChanges();
        const nextButton = fixture.debugElement.query(
            By.css('.mat-paginator-navigation-next')
        );
        const button = nextButton.nativeElement as HTMLElement;
        button.click();
        tick();
        fixture.detectChanges();

        const cards = getVisibleItems();
        expect(cards.length).toBe(2);

        const id: string = cards[1].properties['id'];
        expect(id).toBe(`payment-event-1`);

        component.ngOnDestroy();
        flush();
    }));
});
