import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { RaidenService } from '../../services/raiden.service';
import { TokenNetworkSelectorComponent } from './token-network-selector.component';
import { TestProviders } from '../../../testing/test-providers';
import BigNumber from 'bignumber.js';
import { createToken, createAddress } from '../../../testing/test-data';
import { TokenPollingService } from '../../services/token-polling.service';
import { stub } from '../../../testing/stub';
import {
    mockMatSelectFirst,
    mockOpenMatSelect,
} from '../../../testing/interaction-helper';

describe('TokenNetworkSelectorComponent', () => {
    let component: TokenNetworkSelectorComponent;
    let fixture: ComponentFixture<TokenNetworkSelectorComponent>;

    const connectedToken = createToken({
        connected: {
            channels: 5,
            funds: new BigNumber(10),
            sum_deposits: new BigNumber(50),
        },
    });
    const ownedToken = createToken({
        symbol: 'ATT',
        name: 'Another Test Token',
    });
    const notOwnedToken = createToken({
        symbol: 'ATT2',
        name: 'Another Test Token2',
        balance: new BigNumber(0),
    });
    const tokens = [notOwnedToken, connectedToken, ownedToken];

    beforeEach(async(() => {
        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of(tokens);

        TestBed.configureTestingModule({
            declarations: [TokenNetworkSelectorComponent, TokenPipe],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                { provide: TokenPollingService, useValue: tokenPollingMock },
                RaidenService,
                TestProviders.AddressBookStubProvider(),
            ],
            imports: [
                MaterialComponentsModule,
                HttpClientTestingModule,
                NoopAnimationsModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenNetworkSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should sort tokens first by connection, then owned and last not owned', (done) => {
        component.tokens$.subscribe((value) => {
            expect(value[0].address).toBe(
                connectedToken.address,
                'connection token should go first'
            );
            expect(value[1].address).toBe(
                ownedToken.address,
                'owned token should go second'
            );
            expect(value[2].address).toBe(
                notOwnedToken.address,
                'not owned token should go third'
            );
            done();
        });
    });

    it('should be able to only show connected tokens', (done) => {
        component.onlyConnectedTokens = true;
        fixture.detectChanges();
        component.tokens$.subscribe((value) => {
            expect(value[0].address).toBe(
                connectedToken.address,
                'connection token should go first'
            );
            expect(value.length).toBe(1);
            done();
        });
    });

    it('should select a token network', () => {
        const changeSpy = jasmine.createSpy('onChange');
        const touchedSpy = jasmine.createSpy('onTouched');
        const tokenChangedSpy = jasmine.createSpy('tokenChanged');
        component.registerOnChange(changeSpy);
        component.registerOnTouched(touchedSpy);
        component.tokenChanged.subscribe(tokenChangedSpy);
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();

        expect(component.value).toBe(connectedToken);
        expect(touchedSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith(connectedToken.address);
        expect(tokenChangedSpy).toHaveBeenCalledTimes(1);
        expect(tokenChangedSpy).toHaveBeenCalledWith(connectedToken);
    });

    it('should be able to set a value programmatically', () => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getUserToken').and.returnValue(notOwnedToken);
        const address = notOwnedToken.address;
        component.writeValue(address);
        fixture.detectChanges();

        expect(component.value).toBe(notOwnedToken);
    });

    it('should not to set an unregistered token programmatically', () => {
        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getUserToken').and.returnValue(undefined);
        component.writeValue(createAddress());
        fixture.detectChanges();

        expect(component.value).toBe(undefined);
    });
});
