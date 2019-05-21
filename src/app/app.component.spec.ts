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

describe('AppComponent', () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;
    let isActive: Spy;

    beforeEach(() => {
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
                RaidenService,
                ChannelPollingService
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
});
