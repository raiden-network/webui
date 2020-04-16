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
} from '../../../testing/test-data';
import { stub } from '../../../testing/stub';
import { Network } from '../../utils/network-info';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { QrCodePayload, QrCodeComponent } from '../qr-code/qr-code.component';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { TokenPipe } from '../../pipes/token.pipe';

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

        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of(tokens);

        const channelPollingMock = stub<ChannelPollingService>();
        // @ts-ignore
        channelPollingMock.channels$ = of(channels);

        TestBed.configureTestingModule({
            declarations: [
                HeaderComponent,
                DisplayDecimalsPipe,
                SearchFieldComponent,
                TokenPipe,
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
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                RaidenIconsModule,
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

    it('should toggle the notification panel', () => {
        const toggleSpy = spyOn(notificationService, 'toggleSidenav');
        clickElement(fixture.debugElement, '#notification-button');
        expect(toggleSpy).toHaveBeenCalledTimes(1);
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
            fixture.debugElement.query(By.css('.header__alert-box'))
        ).toBeTruthy();
    });

    it('should not show a warning if balance is greater than zero', () => {
        expect(
            fixture.debugElement.query(By.css('.header__alert-box'))
        ).toBeFalsy();
    });
});
