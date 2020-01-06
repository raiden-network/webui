import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';

import { ChannelComponent } from './channel.component';
import { ClipboardModule } from 'ngx-clipboard';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { TokenPipe } from '../../pipes/token.pipe';
import { StatusPipe } from '../../pipes/status.pipe';
import { createChannel } from '../../../testing/test-data';
import { UserToken } from '../../models/usertoken';
import BigNumber from 'bignumber.js';
import { ChannelActionsComponent } from './channel-actions/channel-actions.component';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { RouterTestingModule } from '@angular/router/testing';
import { TestProviders } from '../../../testing/test-providers';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChannelComponent', () => {
    let component: ChannelComponent;
    let fixture: ComponentFixture<ChannelComponent>;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(20)
    };

    const channel = createChannel({
        id: new BigNumber(1),
        balance: new BigNumber(1),
        totalDeposit: new BigNumber(10),
        totalWithdraw: new BigNumber(10)
    });
    channel.userToken = token;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChannelComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                TokenPipe,
                StatusPipe,
                ChannelActionsComponent,
                PageItemComponent
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                TestProviders.AddressBookStubProvider()
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                RouterTestingModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelComponent);
        component = fixture.componentInstance;
        component.channel = channel;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
