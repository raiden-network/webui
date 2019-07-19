import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ClipboardModule } from 'ngx-clipboard';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { EnvironmentType } from '../../services/enviroment-type.enum';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { SharedService } from '../../services/shared.service';
import { MockConfig } from '../../../testing/mock-config';

import { TokenNetworkComponent } from './token-network.component';
import { TestProviders } from '../../../testing/test-providers';
import { EllipsisPipe } from '../../pipes/ellipsis.pipe';
import { TokenNetworkActionsComponent } from '../token-network-actions/token-network-actions.component';
import { SortFilterPageHeaderComponent } from '../page/sort-filter-page-header/sort-filter-page-header.component';
import { PageBaseComponent } from '../page/page-base/page-base.component';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';
import { of } from 'rxjs';
import { UserToken } from '../../models/usertoken';
import { clickElement } from '../../../testing/interaction-helper';

describe('TokenNetworkComponent', () => {
    let component: TokenNetworkComponent;
    let fixture: ComponentFixture<TokenNetworkComponent>;
    let mockConfiguration: MockConfig;
    let raidenService: RaidenService;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: 20
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TokenNetworkComponent,
                TokenNetworkActionsComponent,
                SortFilterPageHeaderComponent,
                PageBaseComponent,
                PageItemComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
                EllipsisPipe
            ],
            providers: [
                TestProviders.HammerJSProvider(),
                TestProviders.MockRaidenConfigProvider(),
                RaidenService,
                SharedService
            ],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                FormsModule,
                ClipboardModule,
                NoopAnimationsModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        mockConfiguration = TestBed.get(RaidenConfig);
        spyOnProperty(mockConfiguration, 'network$', 'get').and.returnValue(
            of({
                name: 'Test',
                shortName: 'tst',
                chainId: 9001
            })
        );
        raidenService = TestBed.get(RaidenService);
        spyOn(raidenService, 'getTokens').and.returnValue(of([token]));

        fixture = TestBed.createComponent(TokenNetworkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a registration button when configuration is development', async(() => {
        mockConfiguration.config.environment_type = EnvironmentType.DEVELOPMENT;
        fixture.detectChanges();
        const element = fixture.debugElement.query(
            By.css('#token-registration')
        );
        expect(element).toBeTruthy();
    }));

    it('should have registration disabled when configuration is production', async(() => {
        mockConfiguration.config.environment_type = EnvironmentType.PRODUCTION;
        fixture.detectChanges();
        const element = fixture.debugElement.query(
            By.css('#token-registration')
        );
        expect(element).toBeFalsy();
    }));

    it('should request raiden service when mint button is clicked', () => {
        const mintToken = spyOn(raidenService, 'mintToken').and.returnValue(
            of(null)
        );
        clickElement(fixture.debugElement, '#token-mint');
        expect(mintToken).toHaveBeenCalledTimes(1);
        expect(mintToken).toHaveBeenCalledWith(
            token,
            raidenService.raidenAddress,
            1000
        );
    });
});
