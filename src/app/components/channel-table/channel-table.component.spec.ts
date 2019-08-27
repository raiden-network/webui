import { HttpClient, HttpHandler } from '@angular/common/http';
import {
    async,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick
} from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ClipboardModule } from 'ngx-clipboard';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { EMPTY } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { delay, startWith } from 'rxjs/operators';
// @ts-ignore
import { CdkDetailRowDirective } from '../../directives/cdk-detail-row.directive';
import { Channel } from '../../models/channel';
import { UserToken } from '../../models/usertoken';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { EllipsisPipe } from '../../pipes/ellipsis.pipe';
import { KeysPipe } from '../../pipes/keys.pipe';
import { SubsetPipe } from '../../pipes/subset.pipe';
import { TokenPipe } from '../../pipes/token.pipe';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { RaidenService } from '../../services/raiden.service';
import { SharedService } from '../../services/shared.service';
import { AddressInputComponent } from '../address-input/address-input.component';
import { OpenDialogComponent } from '../open-dialog/open-dialog.component';
import { TokenInputComponent } from '../token-input/token-input.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';

import { ChannelTableComponent } from './channel-table.component';
import { StatusPipe } from '../../pipes/status.pipe';
import Spy = jasmine.Spy;
import { TestProviders } from '../../../testing/test-providers';
import { SortFilterPageHeaderComponent } from '../page/sort-filter-page-header/sort-filter-page-header.component';
import { ChannelActionsComponent } from '../channel-actions/channel-actions.component';
import { PageBaseComponent } from '../page/page-base/page-base.component';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { clickElement } from '../../../testing/interaction-helper';
import BigNumber from 'bignumber.js';

describe('ChannelTableComponent', () => {
    let component: ChannelTableComponent;
    let fixture: ComponentFixture<ChannelTableComponent>;
    let channelsSpy: Spy;
    let refreshingSpy: Spy;
    let tokenSpy: Spy;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20)
    };

    const channel1: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(1),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0x774aFb0652ca2c711fD13e6E9d51620568f6Ca82',
        reveal_timeout: 600,
        balance: new BigNumber(10),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel2: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(2),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0xFC57d325f23b9121a8488fFdE2E6b3ef1208a20b',
        reveal_timeout: 600,
        balance: new BigNumber(0),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel3: Channel = {
        state: 'opened',
        channel_identifier: new BigNumber(3),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0xfB398E621c15E2BC5Ae6A508D8D89AF1f88c93e8',
        reveal_timeout: 600,
        balance: new BigNumber(10),
        total_deposit: new BigNumber(10),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    const channel4: Channel = {
        state: 'closed',
        channel_identifier: new BigNumber(4),
        token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        partner_address: '0x8A0cE8bDA200D64d858957080bf7eDDD3371135F',
        reveal_timeout: 600,
        balance: new BigNumber(60),
        total_deposit: new BigNumber(60),
        total_withdraw: new BigNumber(10),
        settle_timeout: 500,
        userToken: token
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChannelTableComponent,
                OpenDialogComponent,
                TokenInputComponent,
                AddressInputComponent,
                SortFilterPageHeaderComponent,
                PageBaseComponent,
                PageItemComponent,
                ChannelActionsComponent,
                TokenPipe,
                EllipsisPipe,
                KeysPipe,
                SubsetPipe,
                DecimalPipe,
                DisplayDecimalsPipe,
                StatusPipe,
                CdkDetailRowDirective,
                TokenNetworkSelectorComponent
            ],
            providers: [
                SharedService,
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                TestProviders.AddressBookStubProvider(),
                RaidenService,
                ChannelPollingService,
                ToastrService,
                HttpClient,
                HttpHandler
            ],
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MaterialComponentsModule,
                RouterTestingModule,
                FormsModule,
                ClipboardModule,
                ToastrModule.forRoot(),
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelTableComponent);
        const service: RaidenService = TestBed.get(RaidenService);
        const channelPollingService: ChannelPollingService = TestBed.get(
            ChannelPollingService
        );
        channelsSpy = spyOn(channelPollingService, 'channels');
        refreshingSpy = spyOn(channelPollingService, 'refreshing');
        tokenSpy = spyOn(service, 'getUserToken');

        component = fixture.componentInstance;
    });

    it('should create', () => {
        channelsSpy.and.returnValues(EMPTY);
        refreshingSpy.and.returnValue(of(false));

        fixture.detectChanges();

        expect(component).toBeTruthy();
    });

    it('should update action when channel has balance', fakeAsync(() => {
        const channel2Balance: Channel = {
            state: 'opened',
            channel_identifier: new BigNumber(2),
            token_address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
            partner_address: '0xFC57d325f23b9121a8488fFdE2E6b3ef1208a20b',
            reveal_timeout: 600,
            balance: new BigNumber(10),
            total_deposit: new BigNumber(10),
            total_withdraw: new BigNumber(10),
            settle_timeout: 500,
            userToken: token
        };

        const mockResponse = of([
            channel1,
            channel2Balance,
            channel3,
            channel4
        ]).pipe(
            delay(5000),
            startWith([channel1, channel2, channel3, channel4])
        );
        channelsSpy.and.returnValues(mockResponse);

        tokenSpy.and.returnValue(of(token));

        tick(5000);
        fixture.detectChanges();

        let channel = fixture.debugElement.query(By.css('#channel_2'));
        let button = channel.query(By.css('#pay-button'));
        let payButton = button.componentInstance as HTMLButtonElement;

        expect(payButton.disabled).toBe(
            true,
            'Payment should be disabled with 0 balance'
        );

        tick(5000);
        fixture.detectChanges();

        channel = fixture.debugElement.query(By.css('#channel_2'));
        button = channel.query(By.css('#pay-button'));
        payButton = button.componentInstance as HTMLButtonElement;

        expect(payButton.disabled).toBe(
            false,
            'Payment option should be enabled with positive balance'
        );

        component.ngOnDestroy();
        flush();
    }));

    it('should update the page immediately when next page is clicked', () => {
        component.pageSize = 3;
        channelsSpy.and.returnValues(
            of([channel1, channel2, channel3, channel4])
        );
        tokenSpy.and.returnValue(of(token));

        fixture.detectChanges();

        let channelListElement = fixture.debugElement.query(
            By.css('.page-list')
        );
        expect(channelListElement.children.length).toBe(3);

        clickElement(fixture.debugElement, '.mat-paginator-navigation-next');
        fixture.detectChanges();

        channelListElement = fixture.debugElement.query(By.css('.page-list'));
        expect(channelListElement.children.length).toBe(1);
    });
});
