import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TransfersPageComponent } from './transfers-page.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { TestProviders } from '../../../testing/test-providers';
import { SelectedTokenService } from '../../services/selected-token.service';
import { PaymentHistoryPollingService } from '../../services/payment-history-polling.service';
import { SharedService } from '../../services/shared.service';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ClipboardModule } from 'ngx-clipboard';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { TokenComponent } from '../token/token.component';
import { TokenPipe } from '../../pipes/token.pipe';
import { HistoryTableComponent } from '../history-table/history-table.component';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { RaidenService } from '../../services/raiden.service';

describe('TransfersPageComponent', () => {
    let component: TransfersPageComponent;
    let fixture: ComponentFixture<TransfersPageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TransfersPageComponent,
                HistoryTableComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                TokenComponent,
                TokenPipe,
            ],
            providers: [
                TestProviders.AddressBookStubProvider(),
                SelectedTokenService,
                PaymentHistoryPollingService,
                SharedService,
                TestProviders.MockRaidenConfigProvider(),
                PendingTransferPollingService,
                ChannelPollingService,
                TokenPollingService,
                TestProviders.MockMatDialog(),
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
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TransfersPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });
});
