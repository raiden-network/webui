import {
    waitForAsync,
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
    createChannel,
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
import {
    clickElement,
    mockOpenMatSelect,
    mockMatSelectByIndex,
} from '../../../testing/interaction-helper';
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
import { stub } from '../../../testing/stub';
import { ChunkPipe } from '../../pipes/chunk.pipe';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { TokenNetworkSelectorComponent } from '../token-network-selector/token-network-selector.component';

describe('ChannelListComponent', () => {
    let component: ChannelListComponent;
    let fixture: ComponentFixture<ChannelListComponent>;

    const token1 = createToken();
    const token2 = createToken({ symbol: 'TST2', name: 'Test Suite Token 2' });
    const channels = [
        createChannel({ userToken: token1, state: 'closed' }),
    ].concat(createTestChannels(10, token1), createTestChannels(10, token2), [
        createChannel({ userToken: token1, state: 'waiting_for_open' }),
        createChannel({ userToken: token2, state: 'closed' }),
    ]);

    beforeEach(
        waitForAsync(() => {
            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of([token1, token2]);
            tokenPollingMock.refresh = () => {};

            TestBed.configureTestingModule({
                declarations: [
                    ChannelListComponent,
                    ChannelComponent,
                    DecimalPipe,
                    DisplayDecimalsPipe,
                    ChunkPipe,
                    BalanceWithSymbolComponent,
                    TokenNetworkSelectorComponent,
                ],
                providers: [
                    TestProviders.MockRaidenConfigProvider(),
                    RaidenService,
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
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
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelListComponent);
        component = fixture.componentInstance;

        const channelPollingService = TestBed.inject(ChannelPollingService);
        const channelsSubject = new BehaviorSubject<Channel[]>([]);
        // @ts-ignore
        channelPollingService.channels$ = channelsSubject.asObservable();

        fixture.detectChanges();
        channelsSubject.next(channels);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should display all channels by default', () => {
        expect(component.visibleChannels.length).toBe(channels.length);
    });

    it('should display the channels sorted', () => {
        for (let i = 0; i < channels.length - 1; i++) {
            if (i === channels.length - 3) {
                expect(component.visibleChannels[i].state).not.toBe('closed');
                expect(component.visibleChannels[i + 1].state).toBe('closed');
                expect(component.visibleChannels[i + 2].state).toBe('closed');
                expect(
                    component.visibleChannels[
                        i + 1
                    ].balance.isGreaterThanOrEqualTo(
                        component.visibleChannels[i + 2].balance
                    )
                ).toBe(true);
                break;
            }
            expect(
                component.visibleChannels[i].balance.isGreaterThanOrEqualTo(
                    component.visibleChannels[i + 1].balance
                )
            ).toBe(true);
        }
    });

    it('should filter the channels by the selected token', () => {
        const selectedTokenService = TestBed.inject(SelectedTokenService);
        const setTokenSpy = spyOn(
            selectedTokenService,
            'setToken'
        ).and.callThrough();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectByIndex(fixture.debugElement, 1);
        fixture.detectChanges();

        expect(setTokenSpy).toHaveBeenCalledTimes(1);
        expect(setTokenSpy).toHaveBeenCalledWith(token1);
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
