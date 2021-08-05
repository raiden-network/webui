import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
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
    mockMatSelectByIndex,
} from '../../../testing/interaction-helper';
import { MatDialog } from '@angular/material/dialog';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { DisplayDecimalsPipe } from 'app/pipes/display-decimals.pipe';

describe('TokenNetworkSelectorComponent', () => {
    let component: TokenNetworkSelectorComponent;
    let fixture: ComponentFixture<TokenNetworkSelectorComponent>;

    const connectedToken = createToken({
        connected: {
            channels: 5,
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
    const tokens = [connectedToken, ownedToken, notOwnedToken];
    const servicesToken = createToken({
        symbol: 'STT',
        name: 'Service Test Token',
    });

    beforeEach(
        waitForAsync(() => {
            const tokenPollingMock = stub<TokenPollingService>();
            // @ts-ignore
            tokenPollingMock.tokens$ = of(tokens);
            tokenPollingMock.refresh = () => {};

            TestBed.configureTestingModule({
                declarations: [
                    TokenNetworkSelectorComponent,
                    DisplayDecimalsPipe,
                ],
                providers: [
                    TestProviders.MockRaidenConfigProvider(),
                    {
                        provide: TokenPollingService,
                        useValue: tokenPollingMock,
                    },
                    RaidenService,
                    TestProviders.AddressBookStubProvider(),
                    TestProviders.MockMatDialog(),
                    TestProviders.MockUserDepositService(servicesToken),
                ],
                imports: [
                    MaterialComponentsModule,
                    HttpClientTestingModule,
                    NoopAnimationsModule,
                    RaidenIconsModule,
                ],
                schemas: [CUSTOM_ELEMENTS_SCHEMA],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenNetworkSelectorComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
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
        component.registerOnChange(changeSpy);
        component.registerOnTouched(touchedSpy);
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();

        expect(component.value).toEqual(connectedToken);
        expect(touchedSpy).toHaveBeenCalled();
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith(connectedToken);
    });

    it('should be able to show and select ETH', () => {
        component.showEthOption = true;
        const changeSpy = jasmine.createSpy('onChange');
        const touchedSpy = jasmine.createSpy('onTouched');
        component.registerOnChange(changeSpy);
        component.registerOnTouched(touchedSpy);
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();

        expect(component.value).toBe('ETH');
        expect(touchedSpy).toHaveBeenCalled();
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith('ETH');
    });

    it('should be able to show and select the services token', () => {
        component.showServicesToken = true;
        const changeSpy = jasmine.createSpy('onChange');
        const touchedSpy = jasmine.createSpy('onTouched');
        component.registerOnChange(changeSpy);
        component.registerOnTouched(touchedSpy);
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();

        expect(component.value).toEqual(servicesToken);
        expect(touchedSpy).toHaveBeenCalled();
        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith(servicesToken);
    });

    it('should be able to set a value programmatically', () => {
        component.writeValue(notOwnedToken);
        fixture.detectChanges();
        expect(component.value).toEqual(notOwnedToken);
    });

    it('should be able to set ETH as value programmatically', () => {
        component.writeValue('ETH');
        fixture.detectChanges();
        expect(component.value).toBe('ETH');
    });

    it('should not to set a non token object programmatically', () => {
        component.writeValue('');
        fixture.detectChanges();
        expect(component.value).toBe(undefined);
    });

    it('should open register dialog', () => {
        const dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
        const raidenService = TestBed.inject(RaidenService);
        const tokenAddress = createAddress();
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => tokenAddress;
        const registerSpy = spyOn(
            raidenService,
            'registerToken'
        ).and.returnValue(of(null));

        component.showRegisterButton = true;
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectByIndex(fixture.debugElement, 0);
        fixture.detectChanges();

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(dialogSpy).toHaveBeenCalledWith(RegisterDialogComponent, {});
        expect(registerSpy).toHaveBeenCalledTimes(1);
        expect(registerSpy).toHaveBeenCalledWith(tokenAddress);
    });

    it('should not register token if dialog is cancelled', () => {
        const dialog = TestBed.inject(MatDialog) as unknown as MockMatDialog;
        const raidenService = TestBed.inject(RaidenService);
        const dialogSpy = spyOn(dialog, 'open').and.callThrough();
        dialog.returns = () => null;
        const registerSpy = spyOn(
            raidenService,
            'registerToken'
        ).and.returnValue(of(null));

        component.showRegisterButton = true;
        fixture.detectChanges();

        mockOpenMatSelect(fixture.debugElement);
        fixture.detectChanges();

        mockMatSelectByIndex(fixture.debugElement, 0);
        fixture.detectChanges();

        expect(dialogSpy).toHaveBeenCalledTimes(1);
        expect(registerSpy).toHaveBeenCalledTimes(0);
    });
});
