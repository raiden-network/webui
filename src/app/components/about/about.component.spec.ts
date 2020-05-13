import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';
import { RaidenService } from '../../services/raiden.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Network } from '../../utils/network-info';
import { TestProviders } from '../../../testing/test-providers';
import { version } from '../../../version';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { createNetworkMock } from '../../../testing/test-data';
import { stub } from '../../../testing/stub';
import { By } from '@angular/platform-browser';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    let raidenService: RaidenService;

    const network: Network = createNetworkMock();

    beforeEach(async(() => {
        const raidenServiceMock = stub<RaidenService>();
        // @ts-ignore
        raidenServiceMock.network$ = of(network);
        raidenServiceMock.getVersion = () => of('0.100.5a1.dev157+geb2af878d');
        // @ts-ignore
        raidenServiceMock.production = true;

        TestBed.configureTestingModule({
            declarations: [AboutComponent],
            providers: [
                {
                    provide: RaidenService,
                    useValue: raidenServiceMock,
                },
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
        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        raidenService = TestBed.inject(RaidenService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        fixture.destroy();
    });

    it('should return the environment information', () => {
        const environment = component.environmentInformation();
        const expectedEnvironment =
            '## System\n- Raiden: v0.100.5a1.dev157+geb2af878d\n' +
            `- WebUI: v${version}\n- Environment: production\n- Network: ${network.name}\n- User agent: ${window.navigator.userAgent}`;
        expect(environment).toBe(expectedEnvironment);
    });

    it('should return the development environment information', () => {
        // @ts-ignore
        raidenService.production = false;
        const environment = component.environmentInformation();
        const expectedEnvironment =
            '## System\n- Raiden: v0.100.5a1.dev157+geb2af878d\n' +
            `- WebUI: v${version}\n- Environment: development\n- Network: ${network.name}\n- User agent: ${window.navigator.userAgent}`;
        expect(environment).toBe(expectedEnvironment);
    });

    it('should return the current year for the copyright information', () => {
        const year = new Date().getFullYear().toString();
        const copyrightElement = fixture.debugElement.query(
            By.css('#copyright')
        );
        expect(copyrightElement.nativeElement.textContent.trim()).toBe(
            `Copyright (c) 2015-${year} Brainbot Labs Est.`
        );
    });
});
