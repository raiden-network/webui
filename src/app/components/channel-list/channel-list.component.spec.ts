import {
    async,
    ComponentFixture,
    TestBed,
    tick,
    fakeAsync,
    flush,
} from '@angular/core/testing';
import { ChannelListComponent } from './channel-list.component';
import {
    createToken,
    createTestChannels,
    createAddress,
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
    OpenDialogResult,
} from '../open-dialog/open-dialog.component';
import { RaidenConfig } from '../../services/raiden.config';
import BigNumber from 'bignumber.js';
import { SharedService } from '../../services/shared.service';
import { AddressBookService } from '../../services/address-book.service';
import { Contacts } from '../../models/contact';

describe('ChannelListComponent', () => {
    let component: ChannelListComponent;
    let fixture: ComponentFixture<ChannelListComponent>;

    const token1 = createToken();
    const token2 = createToken({ symbol: 'TST2', name: 'Test Suite Token 2' });
    const channels = createTestChannels(10, token1).concat(
        createTestChannels(10, token2)
    );

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ChannelListComponent,
                ChannelComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
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
        fixture = TestBed.createComponent(ChannelListComponent);
        component = fixture.componentInstance;

        const channelPollingService = TestBed.inject(ChannelPollingService);
        const channelsSubject = new BehaviorSubject<Channel[]>([]);
        spyOn(channelPollingService, 'channels').and.returnValue(
            channelsSubject.asObservable()
        );

        fixture.detectChanges();
        channelsSubject.next(channels);
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

    it('should be able to display all channels', () => {
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

    it('should filter the channels by the selected token', () => {
        const selectedTokenService = TestBed.inject(SelectedTokenService);
        selectedTokenService.setToken(token1);
        clickElement(fixture.debugElement, '#show-all');
        fixture.detectChanges();

        for (let i = 0; i < component.visibleChannels.length; i++) {
            expect(component.visibleChannels[i].token_address).toBe(
                token1.address
            );
        }
    });

    it('should filter the channels by a token symbol search filter', fakeAsync(() => {
        const sharedService = TestBed.inject(SharedService);
        sharedService.setSearchValue(token2.symbol);
        tick(1000);
        fixture.detectChanges();

        for (let i = 0; i < component.visibleChannels.length; i++) {
            expect(component.visibleChannels[i].token_address).toBe(
                token2.address
            );
        }
        flush();
    }));

    it('should filter the channels by a contact label search filter', fakeAsync(() => {
        const channel = channels[0];
        const addressBookService = TestBed.inject(AddressBookService);
        addressBookService.get = () => {
            const contacts: Contacts = {
                [channel.partner_address]: 'Test partner',
            };
            return contacts;
        };
        fixture.detectChanges();

        const sharedService = TestBed.inject(SharedService);
        sharedService.setSearchValue('Test partner');
        tick(1000);
        fixture.detectChanges();

        expect(component.visibleChannels.length).toBe(1);
        expect(component.visibleChannels[0]).toEqual(channel);
        flush();
    }));

    it('should open open channel dialog', () => {
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const raidenService = TestBed.inject(RaidenService);
        const raidenConfig = TestBed.inject(RaidenConfig);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        const dialogResult: OpenDialogResult = {
            tokenAddress: token1.address,
            partnerAddress: createAddress(),
            balance: new BigNumber(1000),
            settleTimeout: raidenConfig.config.settle_timeout,
        };
        dialog.returns = () => dialogResult;
        const openSpy = spyOn(raidenService, 'openChannel').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#open-channel');

        const payload: OpenDialogPayload = {
            tokenAddress: '',
            defaultSettleTimeout: raidenConfig.config.settle_timeout,
            revealTimeout: raidenConfig.config.reveal_timeout,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(OpenDialogComponent, {
            data: payload,
            width: '360px',
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
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const raidenService = TestBed.inject(RaidenService);

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
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const raidenConfig = TestBed.inject(RaidenConfig);
        const selectedTokenService: SelectedTokenService = TestBed.inject(
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
            revealTimeout: raidenConfig.config.reveal_timeout,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(OpenDialogComponent, {
            data: payload,
            width: '360px',
        });
    });
});
