import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutComponent } from './about.component';
import { RaidenService } from '../../services/raiden.service';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { ClipboardModule } from 'ngx-clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { Network } from '../../utils/network-info';
import { TestProviders } from '../../../testing/test-providers';
import { version } from '../../../version';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    let raidenService: {
        getVersion: () => Observable<string>;
        network$: Observable<Network>;
        production: boolean;
    };

    const network: Network = {
        name: 'Görli',
        shortName: 'gor',
        ensSupported: false,
        chainId: 5
    };

    beforeEach(async(() => {
        const service = {
            getVersion: () => of('0.100.5a1.dev157+geb2af878d'),
            network$: of(network),
            production: true
        };
        TestBed.configureTestingModule({
            declarations: [AboutComponent],
            providers: [
                {
                    provide: RaidenService,
                    useValue: service
                },
                TestProviders.HammerJSProvider()
            ],
            imports: [
                MaterialComponentsModule,
                ClipboardModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        raidenService = TestBed.get(RaidenService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the environment information', () => {
        const environment = component.environmentInformation();
        const expectedEnvironment =
            '## System\n- Raiden: v0.100.5a1.dev157+geb2af878d\n' +
            `- WebUI: v${version}\n- Environment: production\n- Network: ${
                network.name
            }\n- User agent: ${window.navigator.userAgent}`;
        expect(environment).toBe(expectedEnvironment);
    });

    it('should return the development environment information', () => {
        raidenService.production = false;
        const environment = component.environmentInformation();
        const expectedEnvironment =
            '## System\n- Raiden: v0.100.5a1.dev157+geb2af878d\n' +
            `- WebUI: v${version}\n- Environment: development\n- Network: ${
                network.name
            }\n- User agent: ${window.navigator.userAgent}`;
        expect(environment).toBe(expectedEnvironment);
    });
});
