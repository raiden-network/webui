import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ChannelListComponent } from './channel-list.component';
import {
    createToken,
    createRandomChannels,
    createAddress
} from '../../../testing/test-data';
import { ChannelComponent } from '../channel/channel.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { TestProviders } from '../../../testing/test-providers';
import { RaidenService } from '../../services/raiden.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { SelectedTokenService } from '../../services/selected-token.service';
import { BehaviorSubject, of } from 'rxjs';
import { Channel } from '../../models/channel';
import { clickElement } from '../../../testing/interaction-helper';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { MatDialog } from '@angular/material/dialog';
import {
    OpenDialogPayload,
    OpenDialogComponent,
    OpenDialogResult
} from '../open-dialog/open-dialog.component';
import { RaidenConfig } from '../../services/raiden.config';
import BigNumber from 'bignumber.js';

describe('ChannelListComponent', () => {
    let component: ChannelListComponent;
    let fixture: ComponentFixture<ChannelListComponent>;

    const token1 = createToken();
    const token2 = createToken({ symbol: 'TST2', name: 'Test Suite Token 2' });
    const channels = createRandomChannels(10, token1).concat(
        createRandomChannels(10, token2)
    );

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChannelListComponent,
                ChannelComponent,
                DecimalPipe,
                DisplayDecimalsPipe
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                RaidenService,
                TokenPollingService,
                TestProviders.MockMatDialog(),
                ChannelPollingService,
                SelectedTokenService,
                TestProviders.AddressBookStubProvider()
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RaidenIconsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelListComponent);
        component = fixture.componentInstance;

        const channelPollingService = TestBed.get(ChannelPollingService);
        const channelSubject = new BehaviorSubject<Channel[]>([]);
        spyOn(channelPollingService, 'channels').and.returnValue(
            channelSubject.asObservable()
        );

        fixture.detectChanges();
        channelSubject.next(channels);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should not display all channels by default', () => {
        expect(component.visibleChannels.length).toBeGreaterThan(0);
        expect(component.visibleChannels.length).toBeLessThan(channels.length);
    });

    it('should be possible to display all channels', () => {
        clickElement(fixture.debugElement, '#show-all');
        fixture.detectChanges();
        expect(component.visibleChannels.length).toBe(channels.length);
    });

    it('should display the channels sorted', () => {
        clickElement(fixture.debugElement, '#show-all');
        fixture.detectChanges();
        for (let i = 0; i < channels.length - 1; i++) {
            expect(
                component.visibleChannels[i].balance.isGreaterThanOrEqualTo(
                    component.visibleChannels[i + 1].balance
                )
            ).toBe(true);
        }
    });

    it('should filter the channels by token', () => {
        const selectedTokenService: SelectedTokenService = TestBed.get(
            SelectedTokenService
        );
        selectedTokenService.setToken(token1);
        clickElement(fixture.debugElement, '#show-all');
        fixture.detectChanges();

        for (let i = 0; i < component.visibleChannels.length; i++) {
            expect(component.visibleChannels[i].token_address).toBe(
                token1.address
            );
        }
    });

    it('should open open channel dialog', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const raidenService: RaidenService = TestBed.get(RaidenService);
        const raidenConfig: RaidenConfig = TestBed.get(RaidenConfig);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: OpenDialogResult = {
            tokenAddress: token1.address,
            partnerAddress: createAddress(),
            balance: new BigNumber(1000),
            settleTimeout: raidenConfig.config.settle_timeout
        };
        dialog.returns = () => dialogResult;
        const openSpy = spyOn(raidenService, 'openChannel').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#open-channel');

        const payload: OpenDialogPayload = {
            tokenAddress: '',
            defaultSettleTimeout: raidenConfig.config.settle_timeout,
            revealTimeout: raidenConfig.config.reveal_timeout
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(OpenDialogComponent, {
            data: payload,
            width: '360px'
        });
        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
            dialogResult.tokenAddress,
            dialogResult.partnerAddress,
            dialogResult.settleTimeout,
            dialogResult.balance
        );
    });

    it('should not open channel if dialog is cancelled', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const raidenService: RaidenService = TestBed.get(RaidenService);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const openSpy = spyOn(raidenService, 'openChannel').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#open-channel');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledTimes(0);
    });

    it('should open open channel dialog with selected token', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const raidenConfig: RaidenConfig = TestBed.get(RaidenConfig);
        const selectedTokenService: SelectedTokenService = TestBed.get(
            SelectedTokenService
        );
        selectedTokenService.setToken(token1);
        fixture.detectChanges();

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        clickElement(fixture.debugElement, '#open-channel');

        const payload: OpenDialogPayload = {
            tokenAddress: token1.address,
            defaultSettleTimeout: raidenConfig.config.settle_timeout,
            revealTimeout: raidenConfig.config.reveal_timeout
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(OpenDialogComponent, {
            data: payload,
            width: '360px'
        });
    });
});
