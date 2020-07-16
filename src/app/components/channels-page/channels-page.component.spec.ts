import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelsPageComponent } from './channels-page.component';
import { ChannelListComponent } from '../channel-list/channel-list.component';
import { ChannelComponent } from '../channel/channel.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { TestProviders } from '../../../testing/test-providers';
import { RaidenService } from '../../services/raiden.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { SelectedTokenService } from '../../services/selected-token.service';
import { SharedService } from '../../services/shared.service';
import { ChunkPipe } from '../../pipes/chunk.pipe';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';

describe('ChannelsPageComponent', () => {
    let component: ChannelsPageComponent;
    let fixture: ComponentFixture<ChannelsPageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChannelsPageComponent,
                ChannelListComponent,
                ChannelComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                ChunkPipe,
                BalanceWithSymbolComponent,
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
                TokenPollingService,
                TestProviders.MockMatDialog(),
                ChannelPollingService,
                SelectedTokenService,
                TestProviders.AddressBookStubProvider(),
                SharedService,
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RaidenIconsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });
});
