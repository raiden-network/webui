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
    createTestTokens
} from '../../../testing/test-data';
import { stub } from '../../../testing/stub';
import { Network } from '../../utils/network-info';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    let notificationService: NotificationService;
    let networkSubject: BehaviorSubject<Network>;
    const raidenAddress = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
    const balance = '10.123456789';
    const channels = createTestChannels();
    const tokens = createTestTokens();

    beforeEach(async(() => {
        const raidenServiceMock = stub<RaidenService>();
        networkSubject = new BehaviorSubject(createNetworkMock());
        // @ts-ignore
        raidenServiceMock.network$ = networkSubject.asObservable();
        // @ts-ignore
        raidenServiceMock.raidenAddress$ = of(raidenAddress);
        // @ts-ignore
        raidenServiceMock.balance$ = of(balance);

        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of(tokens);

        TestBed.configureTestingModule({
            declarations: [HeaderComponent, DisplayDecimalsPipe],
            providers: [
                NotificationService,
                ChannelPollingService,
                { provide: RaidenService, useValue: raidenServiceMock },
                { provide: TokenPollingService, useValue: tokenPollingMock },
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider()
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule,
                RaidenIconsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;

        const channelPollingService = TestBed.get(ChannelPollingService);
        notificationService = TestBed.get(NotificationService);

        spyOn(channelPollingService, 'channels').and.returnValue(of(channels));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should have a faucet button when network has a faucet', () => {
        clickElement(fixture.debugElement, '.header__account-button');
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('.header__faucet'))
        ).toBeTruthy();
    });

    it('should not have a faucet button when network does not have a faucet', () => {
        networkSubject.next(createNetworkMock({ faucet: null }));
        fixture.detectChanges();
        clickElement(fixture.debugElement, '.header__account-button');
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('.header__faucet'))
        ).toBeFalsy();
    });

    it('should insert the address correctly into the href attribute of the faucet button', () => {
        clickElement(fixture.debugElement, '.header__account-button');
        fixture.detectChanges();
        const href = fixture.debugElement
            .query(By.css('.header__faucet'))
            .nativeElement.getAttribute('href');
        expect(href).toBe(
            'http://faucet.test/?0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
    });

    it('should toggle the notification panel', () => {
        const toggleSpy = spyOn(notificationService, 'toggleSidenav');
        clickElement(fixture.debugElement, '#notification_button');
        expect(toggleSpy).toHaveBeenCalledTimes(1);
    });
});
