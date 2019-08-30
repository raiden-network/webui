import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    async,
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
    flush
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
import Spy = jasmine.Spy;
import BigNumber from 'bignumber.js';
import { PendingTransferPollingService } from '../../services/pending-transfer-polling.service';

describe('TokenNetworkComponent', () => {
    let component: TokenNetworkComponent;
    let fixture: ComponentFixture<TokenNetworkComponent>;
    let mockConfiguration: MockConfig;
    let raidenService: RaidenService;
    let tokenSpy: Spy;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(20)
    };

    const token2: UserToken = {
        address: '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195',
        symbol: 'TST2',
        name: 'Test Suite Token 2',
        balance: new BigNumber(20),
        decimals: 0
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
                PendingTransferPollingService
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
        tokenSpy = spyOn(raidenService, 'getTokens').and.returnValue(
            of([token])
        );

        fixture = TestBed.createComponent(TokenNetworkComponent);
        component = fixture.componentInstance;
    });

    describe('initiated', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should have a registration button when configuration is development', async(() => {
            mockConfiguration.config.environment_type =
                EnvironmentType.DEVELOPMENT;
            fixture.detectChanges();
            const element = fixture.debugElement.query(
                By.css('#token-registration')
            );
            expect(element).toBeTruthy();
        }));

        it('should have registration disabled when configuration is production', async(() => {
            mockConfiguration.config.environment_type =
                EnvironmentType.PRODUCTION;
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
                new BigNumber(10000000000000000)
            );
        });
    });

    describe('on init', () => {
        it('should start the polling loop and request tokens every 5 seconds', fakeAsync(() => {
            fixture.detectChanges();
            expect(component.tokens).toEqual([token]);
            expect(tokenSpy).toHaveBeenCalledTimes(1);
            expect(tokenSpy).toHaveBeenCalledWith(true);
            tick(5000);
            fixture.detectChanges();
            expect(component.tokens).toEqual([token]);
            expect(tokenSpy).toHaveBeenCalledTimes(2);
            expect(tokenSpy).toHaveBeenCalledWith(true);
            fixture.destroy();
            flush();
        }));
    });

    describe('with a different token', () => {
        beforeEach(() => {
            tokenSpy.and.returnValue(of([token2]));
            fixture.detectChanges();
        });

        it('should request 1000 tokens when token has no decimals', () => {
            const mintToken = spyOn(raidenService, 'mintToken').and.returnValue(
                of(null)
            );
            clickElement(fixture.debugElement, '#token-mint');
            expect(mintToken).toHaveBeenCalledTimes(1);
            expect(mintToken).toHaveBeenCalledWith(
                token2,
                raidenService.raidenAddress,
                new BigNumber(1000)
            );
        });
    });
});
