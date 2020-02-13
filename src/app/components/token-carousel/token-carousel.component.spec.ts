import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush
} from '@angular/core/testing';
import { TokenCarouselComponent } from './token-carousel.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { stub } from '../../../testing/stub';
import { RaidenService } from '../../services/raiden.service';
import {
    createNetworkMock,
    createTestTokens,
    createAddress
} from '../../../testing/test-data';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TokenComponent } from '../token/token.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { TokenPollingService } from '../../services/token-polling.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { of, NEVER } from 'rxjs';
import { SelectedTokenService } from '../../services/selected-token.service';
import { TestProviders } from '../../../testing/test-providers';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { clickElement } from '../../../testing/interaction-helper';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { SharedService } from '../../services/shared.service';

describe('TokenCarouselComponent', () => {
    let component: TokenCarouselComponent;
    let fixture: ComponentFixture<TokenCarouselComponent>;

    const tokens = createTestTokens(6);

    beforeEach(async(() => {
        const raidenServiceMock = stub<RaidenService>();
        // @ts-ignore
        raidenServiceMock.network$ = of(createNetworkMock());
        // @ts-ignore
        raidenServiceMock.paymentInitiated$ = NEVER;
        // @ts-ignore
        raidenServiceMock.registerToken = () => {};

        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of(tokens);
        tokenPollingMock.refresh = () => {};

        TestBed.configureTestingModule({
            declarations: [
                TokenCarouselComponent,
                TokenComponent,
                DecimalPipe,
                DisplayDecimalsPipe
            ],
            providers: [
                {
                    provide: RaidenService,
                    useValue: raidenServiceMock
                },
                ChannelPollingService,
                {
                    provide: TokenPollingService,
                    useValue: tokenPollingMock
                },
                SelectedTokenService,
                TestProviders.MockMatDialog(),
                TestProviders.HammerJSProvider(),
                TestProviders.MockRaidenConfigProvider(),
                SharedService
            ],
            imports: [
                RaidenIconsModule,
                MaterialComponentsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenCarouselComponent);
        component = fixture.componentInstance;

        const channelPollingService = TestBed.get(ChannelPollingService);
        spyOn(channelPollingService, 'channels').and.returnValue(of([]));

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should have all networks view selected by default', () => {
        expect(component.currentSelection).toEqual({ allNetworksView: true });
    });

    it('should scroll to the next item when button clicked', () => {
        clickElement(fixture.debugElement, '#next');
        expect(component.currentItem).toBe(1);
    });

    it('should scroll to the previous item when button clicked', () => {
        component.currentItem = 2;
        fixture.detectChanges();
        clickElement(fixture.debugElement, '#previous');
        expect(component.currentItem).toBe(1);
    });

    it('should not scroll to the next item when on last item', () => {
        component.currentItem = tokens.length;
        fixture.detectChanges();
        component.next();
        expect(component.currentItem).toBe(tokens.length);
    });

    it('should not scroll to the previous item when on first item', () => {
        component.previous();
        expect(component.currentItem).toBe(0);
    });

    it('should be able to select a token', async(() => {
        const selectedTokenService: SelectedTokenService = TestBed.get(
            SelectedTokenService
        );
        const setTokenSpy = spyOn(
            selectedTokenService,
            'setToken'
        ).and.callThrough();
        const selection = tokens[1];
        component.select(selection);

        expect(setTokenSpy).toHaveBeenCalledTimes(1);
        expect(setTokenSpy).toHaveBeenCalledWith(selection);
    }));

    it('should be able to select the all networks view', () => {
        const selectedTokenService: SelectedTokenService = TestBed.get(
            SelectedTokenService
        );
        const token = tokens[1];
        component.select(token);

        const setTokenSpy = spyOn(
            selectedTokenService,
            'setToken'
        ).and.callThrough();
        const allNetworksView = { allNetworksView: true };
        component.select(allNetworksView);

        expect(setTokenSpy).toHaveBeenCalledTimes(1);
        expect(setTokenSpy).toHaveBeenCalledWith(undefined);
    });

    it('should display the current selection correctly', () => {
        const allNetworksView = { allNetworksView: true };
        expect(component.isSelected(allNetworksView)).toBe(true);
        expect(component.isSelected(tokens[0])).toBe(false);

        component.currentSelection = tokens[0];
        fixture.detectChanges();
        expect(component.isSelected(allNetworksView)).toBe(false);
        expect(component.isSelected(tokens[0])).toBe(true);
    });

    it('should filter the tokens by a token symbol search filter', fakeAsync(() => {
        const token = tokens[3];
        const sharedService: SharedService = TestBed.get(SharedService);
        sharedService.setSearchValue(token.symbol);
        tick(1000);
        fixture.detectChanges();

        expect(component.visibleItems.length).toBe(2);
        expect(component.visibleItems[0]).toEqual({ allNetworksView: true });
        expect(component.visibleItems[1]).toEqual(token);
        flush();
    }));

    it('should open register dialog', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const raidenService: RaidenService = TestBed.get(RaidenService);

        const tokenAddress = createAddress();
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => tokenAddress;
        const registerSpy = spyOn(
            raidenService,
            'registerToken'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '.register-button');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(RegisterDialogComponent, {
            width: '360px'
        });
        expect(registerSpy).toHaveBeenCalledTimes(1);
        expect(registerSpy).toHaveBeenCalledWith(tokenAddress);
    });

    it('should not register token if dialog is cancelled', () => {
        const dialog: MockMatDialog = TestBed.get(MatDialog);
        const raidenService: RaidenService = TestBed.get(RaidenService);

        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const registerSpy = spyOn(
            raidenService,
            'registerToken'
        ).and.returnValue(of(null));
        clickElement(fixture.debugElement, '.register-button');

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(registerSpy).toHaveBeenCalledTimes(0);
    });
});
