import { async, ComponentFixture, TestBed } from '@angular/core/testing';
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
import { UserDepositService } from '../../services/user-deposit.service';
import BigNumber from 'bignumber.js';
import { SharedService } from '../../services/shared.service';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    let notificationService: NotificationService;
    let networkSubject: BehaviorSubject<Network>;
    let balanceSubject: BehaviorSubject<string>;
    const raidenAddress = createAddress();
    const channels = createTestChannels();
    const tokens = createTestTokens();

    beforeEach(async(() => {
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

        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of(tokens);

        const channelPollingMock = stub<ChannelPollingService>();
        // @ts-ignore
        channelPollingMock.channels$ = of(channels);

        const userDepositMock = stub<UserDepositService>();
        // @ts-ignore
        userDepositMock.balance$ = of(new BigNumber('750000000000000000'));
        // @ts-ignore
        userDepositMock.servicesToken$ = of(createToken());

        TestBed.configureTestingModule({
            declarations: [
                HeaderComponent,
                DisplayDecimalsPipe,
                SearchFieldComponent,
                DecimalPipe,
            ],
            providers: [
                NotificationService,
                {
                    provide: ChannelPollingService,
                    useValue: channelPollingMock,
                },
                { provide: RaidenService, useValue: raidenServiceMock },
                { provide: TokenPollingService, useValue: tokenPollingMock },
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.MockMatDialog(),
                TestProviders.AddressBookStubProvider(),
                { provide: UserDepositService, useValue: userDepositMock },
                SharedService,
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
    }));

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

    it('should have a faucet button when network has a faucet', () => {
        expect(
            fixture.debugElement.query(By.css('#faucet-button'))
        ).toBeTruthy();
    });

    it('should not have a faucet button when network does not have a faucet', () => {
        networkSubject.next(createNetworkMock({ faucet: null }));
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#faucet-button'))
        ).toBeFalsy();
    });

    it('should insert the address correctly into the href attribute of the faucet button', () => {
        const href = fixture.debugElement
            .query(By.css('#faucet-button'))
            .nativeElement.getAttribute('href');
        expect(href).toBe(`http://faucet.test/?${raidenAddress}`);
    });

    it('should show the qr code dialog for the raiden address', () => {
        const dialog = (<unknown>TestBed.inject(MatDialog)) as MockMatDialog;
        const dialogSpy = spyOn(dialog, 'open');

        clickElement(fixture.debugElement, '#qr-button');
        fixture.detectChanges();

        const payload: QrCodePayload = {
            content: raidenAddress,
        };
        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(QrCodeComponent, {
            data: payload,
            width: '360px',
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
        expect(balanceText).toBe('0.75');
    });

    it('should show the token on-chain balances in an overlay', () => {
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
        const overlay = fixture.debugElement.query(By.css('.balances-overlay'))
            .nativeElement;
        sharedService.newGlobalClick(overlay);
        fixture.detectChanges();
        expect(component.tokenBalancesOpen).toBe(true);
    });
});
