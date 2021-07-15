import {
    waitForAsync,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { NotificationService } from '../../services/notification.service';
import { ChannelPollingService } from '../../services/channel-polling.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { RaidenService } from '../../services/raiden.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestProviders } from '../../../testing/test-providers';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { clickElement } from '../../../testing/interaction-helper';
import { By } from '@angular/platform-browser';
import { of, BehaviorSubject } from 'rxjs';
import {
    createNetworkMock,
    createTestChannels,
    createTestTokens,
    createAddress,
    createToken,
} from '../../../testing/test-data';
import { stub } from '../../../testing/stub';
import { Network } from '../../utils/network-info';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { QrCodePayload, QrCodeComponent } from '../qr-code/qr-code.component';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { ToastrModule } from 'ngx-toastr';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { SharedService } from '../../services/shared.service';
import { UserToken } from '../../models/usertoken';
import { BalanceWithSymbolComponent } from '../balance-with-symbol/balance-with-symbol.component';
import { SelectedTokenService } from 'app/services/selected-token.service';
import { getMintAmount } from 'app/shared/mint-amount';
import { UserDepositDialogComponent } from '../user-deposit-dialog/user-deposit-dialog.component';
import { ShortenAddressPipe } from 'app/pipes/shorten-address.pipe';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    let notificationService: NotificationService;
    let networkSubject: BehaviorSubject<Network>;
    let balanceSubject: BehaviorSubject<string>;
    let tokensSubject: BehaviorSubject<UserToken[]>;
    const raidenAddress = createAddress();
    const channels = createTestChannels();
    const tokens = createTestTokens();
    const servicesToken = createToken();

    beforeEach(
        waitForAsync(() => {
            const raidenServiceMock = stub<RaidenService>();
            networkSubject = new BehaviorSubject(createNetworkMock());
            // @ts-ignore
            raidenServiceMock.network$ = networkSubject.asObservable();
            // @ts-ignore
            raidenServiceMock.raidenAddress$ = of(raidenAddress);
            balanceSubject = new BehaviorSubject('10.123456789');
            // @ts-ignore
            raidenServiceMock.balance$ = balanceSubject.asObservable();
            raidenServiceMock.getUserToken = () => undefined;
            raidenServiceMock.mintToken = () => of(null);

            const tokenPollingMock = stub<TokenPollingService>();
            tokensSubject = new BehaviorSubject(tokens);
            // @ts-ignore
            tokenPollingMock.tokens$ = tokensSubject.asObservable();
            tokenPollingMock.refresh = () => {};

            const channelPollingMock = stub<ChannelPollingService>();
            // @ts-ignore
            channelPollingMock.channels$ = of(channels);

            TestBed.configureTestingModule({
                declarations: [
                    HeaderComponent,
                    DisplayDecimalsPipe,
                    SearchFieldComponent,
                    DecimalPipe,
                    BalanceWithSymbolComponent,
                    ShortenAddressPipe,
                ],
                providers: [
                    NotificationService,
                    {
                        provide: ChannelPollingService,
                        useValue: channelPollingMock,
                    },
                    { provide: RaidenService, useValue: raidenServiceMock },
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    TestProviders.MockRaidenConfigProvider(),
                    TestProviders.MockMatDialog(),
                    TestProviders.AddressBookStubProvider(),
                    TestProviders.MockUserDepositService(servicesToken),
                    SharedService,
                    SelectedTokenService,
                ],
                imports: [
                    MaterialComponentsModule,
                    ClipboardModule,
                    HttpClientTestingModule,
                    RaidenIconsModule,
                    ToastrModule.forRoot({ timeOut: 50, easeTime: 0 }),
                    NoopAnimationsModule,
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        notificationService = TestBed.inject(NotificationService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should show the qr code dialog for the raiden address', () => {
        const dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open');

        clickElement(fixture.debugElement, '#qr-button');
        fixture.detectChanges();

        const payload: QrCodePayload = {
            content: raidenAddress,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(QrCodeComponent, {
            data: payload,
            width: '550px',
        });
    });

    it('should show a warning if balance is zero', () => {
        balanceSubject.next('0');
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#balance-alert'))
        ).toBeTruthy();
    });

    it('should not show a warning if balance is greater than zero', () => {
        expect(
            fixture.debugElement.query(By.css('#balance-alert'))
        ).toBeFalsy();
    });

    it('should not show a notifications badge by default', () => {
        expect(fixture.debugElement.query(By.css('#badge'))).toBeFalsy();
    });

    it('should display a badge if there are notifications', () => {
        notificationService.addInfoNotification({
            title: 'Testing',
            description: 'Currently testing the application.',
            icon: '',
        });
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#badge'))).toBeTruthy();
    });

    it('should show the UDC balance', () => {
        const balanceElement = fixture.debugElement.query(
            By.css('#udc-balance')
        );
        const balanceText = balanceElement.nativeElement.innerText.trim();
        expect(balanceText).toBe(`0.75 ${servicesToken.symbol}`);
    });

    it('should show the token on-chain balances inside the header for one token', () => {
        const oneToken = createTestTokens(1);
        tokensSubject.next(oneToken);
        fixture.detectChanges();

        expect(
            fixture.debugElement.query(By.css('#on-chain-balances-button'))
        ).toBeFalsy();
        const balances = fixture.debugElement.queryAll(
            By.css('.header__token-balance')
        );
        expect(balances.length).toBe(1);
    });

    it('should show the token on-chain balances in an overlay for more than one token', () => {
        clickElement(fixture.debugElement, '.balances-button');
        fixture.detectChanges();
        expect(component.tokenBalancesOpen).toBe(true);
    });

    it('should close the balances overlay when clicked elsewhere', () => {
        const sharedService = TestBed.inject(SharedService);
        clickElement(fixture.debugElement, '.balances-button');
        fixture.detectChanges();
        sharedService.newGlobalClick(document.createElement('div'));
        fixture.detectChanges();
        expect(component.tokenBalancesOpen).toBe(false);
    });

    it('should not close the balances overlay when global click emits itself as target', () => {
        const sharedService = TestBed.inject(SharedService);
        clickElement(fixture.debugElement, '.balances-button');
        fixture.detectChanges();
        const overlay = fixture.debugElement.query(
            By.css('.balances-overlay')
        ).nativeElement;
        sharedService.newGlobalClick(overlay);
        fixture.detectChanges();
        expect(component.tokenBalancesOpen).toBe(true);
    });

    it('should show the selected token first in the header', fakeAsync(() => {
        const selectedTokenService = TestBed.inject(SelectedTokenService);
        selectedTokenService.setToken(tokens[2]);
        fixture.detectChanges();

        component.tokens$.subscribe((componentTokens) =>
            expect(componentTokens[0].address).toBe(tokens[2].address)
        );
        tick();
    }));

    it('should mint tokens', () => {
        const raidenService = TestBed.inject(RaidenService);
        const mintSpy = spyOn(raidenService, 'mintToken').and.callThrough();

        clickElement(fixture.debugElement, '#mint');
        fixture.detectChanges();

        expect(mintSpy).toHaveBeenCalledTimes(1);
        expect(mintSpy).toHaveBeenCalledWith(
            tokens[0],
            getMintAmount(tokens[0].decimals)
        );
    });

    it('should open the UDC dialog', () => {
        const dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open');

        clickElement(fixture.debugElement, '#open-udc');
        fixture.detectChanges();

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(UserDepositDialogComponent, {
            width: '509px',
        });
    });
});
