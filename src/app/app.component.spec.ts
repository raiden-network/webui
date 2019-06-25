import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ClipboardModule } from 'ngx-clipboard';

import { AppComponent } from './app.component';
import { MockConfig } from '../testing/mock-config';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { ChannelPollingService } from './services/channel-polling.service';
import { RaidenConfig } from './services/raiden.config';
import { RaidenService } from './services/raiden.service';
import { SharedService } from './services/shared.service';
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
import { clickElement } from '../testing/interaction-helper';

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;
    let isActive: Spy;
    let service: {
        network$: ReplaySubject<Network>;
        balance$: ReplaySubject<string>;
        production: boolean;
        raidenAddress$: ReplaySubject<string>;
        getChannels: () => Observable<any>;
    };

    beforeEach(() => {
        const networkMock = new ReplaySubject<Network>(1);
        const balanceMock = new ReplaySubject<string>(1);
        const addressMock = new ReplaySubject<string>(1);

        service = {
            network$: networkMock,
            balance$: balanceMock,
            production: true,
            raidenAddress$: addressMock,
            getChannels: () => EMPTY
        };

        networkMock.next({
            name: 'Test',
            shortName: 'tst',
            chainId: 9001,
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
                DisplayDecimalsPipe
            ],
            providers: [
                {
                    provide: RaidenConfig,
                    useClass: MockConfig
                },
                SharedService,
                {
                    provide: RaidenService,
                    useValue: service
                },
                ChannelPollingService,
                TestProviders.HammerJSProvider()
            ],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                ClipboardModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();

        const mediaObserver = TestBed.get(MediaObserver);
        isActive = spyOn(mediaObserver, 'isActive');

        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        app = fixture.debugElement.componentInstance;
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
        expect(app.isMobile()).toBe(false);
        expect(app.menuOpen).toBe(true);
        app.closeMenu();
        expect(app.menuOpen).toBe(true);
    });

    it('should allow the menu to be toggled on mobile devices', function() {
        isActive.and.returnValue(true);
        expect(app.isMobile()).toBe(true);
        expect(app.menuOpen).toBe(false);
        app.toggleMenu();
        expect(app.menuOpen).toBe(true);
    });

    it('should have a faucet button when network has a faucet', function() {
        expect(
            fixture.debugElement.query(By.css('.faucet-button'))
        ).toBeTruthy();
    });

    it('should not have a faucet button when network does not have a faucet', function() {
        service.network$.next({
            name: 'Test',
            shortName: 'tst',
            chainId: 9001
        });
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('.faucet-button'))
        ).toBeFalsy();
    });

    it('should have a mobile faucet button only on mobile devices', function() {
        isActive.and.returnValue(false);
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#mobile-faucet-button'))
        ).toBeFalsy();
        isActive.and.returnValue(true);
        fixture.detectChanges();
        expect(
            fixture.debugElement.query(By.css('#mobile-faucet-button'))
        ).toBeTruthy();
    });

    it('should open the faucet URL in a new page when the faucet button is clicked', function() {
        spyOn(window, 'open').and.callFake(function() {
            return true;
        });
        clickElement(fixture.debugElement, '.faucet-button');
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledWith(
            'http://faucet.test/?0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
            '_blank'
        );
    });
});
