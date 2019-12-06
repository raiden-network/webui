import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ClipboardModule } from 'ngx-clipboard';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { MockConfig } from '../testing/mock-config';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenConfig } from './services/raiden.config';
import { RaidenService } from './services/raiden.service';
import { ErrorComponent } from './components/error/error.component';
import { MediaObserver } from '@angular/flex-layout';
import Spy = jasmine.Spy;
import { NavigationEntryComponent } from './components/navigation-entry/navigation-entry.component';
import { ShortenAddressPipe } from './pipes/shorten-address.pipe';
import { DisplayDecimalsPipe } from './pipes/display-decimals.pipe';
import { EMPTY, Observable, ReplaySubject } from 'rxjs';
import { TestProviders } from '../testing/test-providers';
import { Network } from './utils/network-info';
import { By } from '@angular/platform-browser';
import { NotificationService } from './services/notification.service';
import { NotificationPanelComponent } from './components/notification/notification-panel/notification-panel.component';
import { NotificationItemComponent } from './components/notification/notification-item/notification-item.component';
import { HttpErrorResponse } from '@angular/common/http';
import { clickElement } from '../testing/interaction-helper';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;
    let isActive: Spy;
    let raidenService: {
        network$: ReplaySubject<Network>;
        balance$: ReplaySubject<string>;
        production: boolean;
        raidenAddress$: ReplaySubject<string>;
        paymentInitiated$: Observable<void>;
        globalRetry$: Observable<void>;
        getChannels: () => Observable<any>;
        attemptRpcConnection: () => void;
        attemptApiConnection: () => void;
    };
    let notificationService: NotificationService;

    beforeEach(() => {
        const networkMock = new ReplaySubject<Network>(1);
        const balanceMock = new ReplaySubject<string>(1);
        const addressMock = new ReplaySubject<string>(1);

        raidenService = {
            network$: networkMock,
            balance$: balanceMock,
            production: true,
            raidenAddress$: addressMock,
            paymentInitiated$: EMPTY,
            globalRetry$: EMPTY,
            getChannels: () => EMPTY,
            attemptRpcConnection: () => {},
            attemptApiConnection: () => {}
        };

        networkMock.next({
            name: 'Test',
            shortName: 'tst',
            chainId: 9001,
            ensSupported: false,
            faucet: 'http://faucet.test/?${ADDRESS}'
        });
        balanceMock.next('0.00000001');
        addressMock.next('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');

        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                ErrorComponent,
                NavigationEntryComponent,
                ShortenAddressPipe,
                DisplayDecimalsPipe,
                NotificationPanelComponent,
                NotificationItemComponent
            ],
            providers: [
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                },
                {
                    provide: RaidenService,
                    useValue: raidenService
                },
                ChannelPollingService,
                TestProviders.HammerJSProvider(),
                NotificationService
            ],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                ClipboardModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
                ToastrModule.forRoot({ timeOut: 50, easeTime: 0 })
            ]
        }).compileComponents();

        const mediaObserver = TestBed.get(MediaObserver);
        isActive = spyOn(mediaObserver, 'isActive');

        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        app = fixture.debugElement.componentInstance;
        notificationService = TestBed.get(NotificationService);
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create the app', async(() => {
        expect(app).toBeTruthy();
        fixture.destroy();
    }));

    it(`should have as title 'Raiden!'`, async(() => {
        expect(app.title).toEqual('Raiden');
        fixture.destroy();
    }));

    it('should have the menu always open if it is not mobile', function() {
        isActive.and.returnValue(false);
        fixture.detectChanges();
        expect(app.isMobile()).toBe(false);
        expect(app.menuSidenav.opened).toBe(true);
        app.closeMenu();
        expect(app.menuSidenav.opened).toBe(true);
    });

    it('should allow the menu to be toggled on mobile devices', function() {
        isActive.and.returnValue(true);
        fixture.detectChanges();
        expect(app.isMobile()).toBe(true);
        expect(app.menuSidenav.opened).toBe(false);
        app.toggleMenu();
        expect(app.menuSidenav.opened).toBe(true);
    });

    it('should allow the menu to be closed on mobile devices', function() {
        isActive.and.returnValue(true);
        fixture.detectChanges();
        expect(app.isMobile()).toBe(true);
        app.toggleMenu();
        expect(app.menuSidenav.opened).toBe(true);
        app.closeMenu();
        expect(app.menuSidenav.opened).toBe(false);
    });

    it('should have a faucet button when network has a faucet', function() {
        expect(
            fixture.debugElement.query(By.css('.faucet-button'))
        ).toBeTruthy();
    });

    it('should not have a faucet button when network does not have a faucet', function() {
        raidenService.network$.next({
            name: 'Test',
            shortName: 'tst',
            ensSupported: false,
            chainId: 9001
        });
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('.faucet-button'))
        ).toBeFalsy();
    });

    it('should insert the address correctly into the href attribute of the faucet button', function() {
        const href = fixture.debugElement
            .query(By.css('.faucet-button'))
            .nativeElement.getAttribute('href');
        expect(href).toBe(
            'http://faucet.test/?0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
    });

    it('should update the color of the notification panel button for new notifications', fakeAsync(() => {
        notificationService.addSuccessNotification({
            title: 'Test',
            description: 'Testing'
        });
        tick(50);
        expect(app.notificationBlink).toBe('rgba(255, 255, 255, 0.5)');
        tick(150);
        expect(app.notificationBlink).toBe('black');
        flush();
    }));

    it('should insert the address correctly into the href attribute of the faucet button', function() {
        const href = fixture.debugElement
            .query(By.css('.faucet-button'))
            .nativeElement.getAttribute('href');
        expect(href).toBe(
            'http://faucet.test/?0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
        );
    });

    it('should show the API error screen and call raiden service on retry', function() {
        const attemptConnectionSpy = spyOn(
            fixture.componentInstance,
            'attemptApiConnection'
        );
        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        fixture.detectChanges();

        const errorComponent = fixture.debugElement.query(
            By.directive(ErrorComponent)
        );
        expect(errorComponent).toBeTruthy();
        const title = errorComponent.query(By.css('.title'));
        expect(title.nativeElement.innerText).toBe(
            'Raiden API connection error!'
        );
        clickElement(errorComponent, '#retry');
        expect(attemptConnectionSpy).toHaveBeenCalledTimes(1);
    });

    it('should show the RPC error screen and call raiden service on retry', function() {
        const attemptConnectionSpy = spyOn(
            fixture.componentInstance,
            'attemptRpcConnection'
        );
        notificationService.rpcError = new Error('RPC error occurred.');
        fixture.detectChanges();

        const errorComponent = fixture.debugElement.query(
            By.directive(ErrorComponent)
        );
        expect(errorComponent).toBeTruthy();
        const title = errorComponent.query(By.css('.title'));
        expect(title.nativeElement.innerText).toBe(
            'JSON RPC connection error!'
        );
        clickElement(errorComponent, '#retry');
        expect(attemptConnectionSpy).toHaveBeenCalledTimes(1);
    });

    it('should show the API error screen when there is an API and a RPC error', function() {
        const error = new HttpErrorResponse({});
        // @ts-ignore
        error.message = 'API error occurred.';
        notificationService.apiError = error;
        notificationService.rpcError = new Error('RPC error occurred.');
        fixture.detectChanges();

        const errorComponent = fixture.debugElement.query(
            By.directive(ErrorComponent)
        );
        expect(errorComponent).toBeTruthy();
        const title = errorComponent.query(By.css('.title'));
        expect(title.nativeElement.innerText).toBe(
            'Raiden API connection error!'
        );
    });

    it('should return null for api error message and rpc stacktrace by default', function() {
        const component = fixture.componentInstance;
        expect(component.getApiErrorMessage()).toBeNull();
        expect(component.getRpcErrorTrace()).toBeNull();
    });
});
