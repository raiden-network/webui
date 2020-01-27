import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
    async,
    ComponentFixture,
    fakeAsync,
    flush,
    TestBed,
    tick
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { RegisteredNetworkValidatorDirective } from '../../directives/registered-network-validator.directive';
import { UserToken } from '../../models/usertoken';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { RaidenConfig } from '../../services/raiden.config';
import { RaidenService } from '../../services/raiden.service';
import { MockConfig } from '../../../testing/mock-config';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';

import { TokenNetworkSelectorComponent } from './token-network-selector.component';
import {
    errorMessage,
    mockInput,
    mockFormInput
} from '../../../testing/interaction-helper';
import { TestProviders } from '../../../testing/test-providers';
import BigNumber from 'bignumber.js';

describe('TokenNetworkSelectorComponent', () => {
    let component: TokenNetworkSelectorComponent;
    let fixture: ComponentFixture<TokenNetworkSelectorComponent>;

    let mockConfig: MockConfig;
    let raidenSpy: jasmine.Spy;

    const connectedToken: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20),
        connected: {
            channels: 5,
            funds: new BigNumber(10),
            sum_deposits: new BigNumber(50)
        }
    };

    const ownedToken: UserToken = {
        address: '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195',
        symbol: 'ATT',
        name: 'Another Test Token',
        decimals: 0,
        balance: new BigNumber(400)
    };

    const notOwnedToken: UserToken = {
        address: '0xB9eF346D094864794a0666D6E84D7Ebd640B4EC5',
        symbol: 'ATT2',
        name: 'Another Test Token2',
        decimals: 18,
        balance: new BigNumber(0)
    };

    const tokens = [notOwnedToken, connectedToken, ownedToken];

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TokenNetworkSelectorComponent,
                RegisteredNetworkValidatorDirective,
                TokenPipe
            ],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                HttpClientTestingModule,
                NoopAnimationsModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        const raidenService = TestBed.get(RaidenService);
        raidenSpy = spyOn(raidenService, 'getTokens');
        raidenSpy.and.returnValue(of(tokens));
        mockConfig = TestBed.get(RaidenConfig);
        spyOn(raidenService, 'getUserToken').and.returnValue(connectedToken);

        fixture = TestBed.createComponent(TokenNetworkSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        mockConfig.setIsChecksum(true);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should order filtered tokens first by connection, then owned and last not owned', fakeAsync(() => {
        let done = false;
        component.filteredOptions$.subscribe(
            value => {
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
                done = true;
            },
            error => fail(error)
        );
        tick();
        expect(done).toBe(true);
        flush();
    }));

    it('should not show an error without a user input', () => {
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors while the user types', () => {
        mockInput(fixture.debugElement, 'input', '0x34234');
        component.tokenFc.setValue('0x34234');
        component.tokenFc.markAsDirty();
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            `Invalid token network address length`
        );
    });

    it('should show an error if the input is empty', () => {
        mockFormInput(fixture.debugElement, 'tokenFc', '');
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            `Please select a token network`
        );
    });

    it('should show an error if the error is not 42 characters long', () => {
        mockFormInput(fixture.debugElement, 'tokenFc', '0x34234');
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            `Invalid token network address length`
        );
    });

    it('should show an error if the address is not valid', () => {
        mockFormInput(
            fixture.debugElement,
            'tokenFc',
            'abbfosdaiudaisduaosiduaoisduaoisdu23423423'
        );
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'This is not a valid token network address.'
        );
    });

    it('should show an error if network not in registered networks', () => {
        const address = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
        mockFormInput(fixture.debugElement, 'tokenFc', address);
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'This address does not belong to a registered token network'
        );
    });

    it('should show error when address is not in checksum format', () => {
        mockConfig.setIsChecksum(false);
        mockConfig.updateChecksumAddress(
            '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195'
        );
        mockFormInput(
            fixture.debugElement,
            'tokenFc',
            '0xeb7f4bbaa1714f3e5a12ff8b681908d7b98bd195'
        );
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBe(
            'Address is not in checksum format: 0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195'
        );
    });

    it('should update form control value properly if a truthy value is passed', () => {
        const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        component.writeValue(address);
        expect(component.tokenFc.value).toBe(address);
    });

    it('should reset form control when a falsy value is passed', () => {
        const address = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
        component.writeValue(address);
        component.writeValue(null);
        expect(component.tokenFc.value).toBe('');
        expect(component.validate(component.tokenFc).empty).toBeTruthy();
    });

    it('should emit the selected token when the user selects a token', fakeAsync(() => {
        let valueChange = 0;
        component.tokenChanged.subscribe(value => {
            valueChange++;
            expect(value).toBe(connectedToken);
        });

        mockFormInput(fixture.debugElement, 'tokenFc', 'TS');
        fixture.detectChanges();

        tick();
        const options = fixture.debugElement.queryAll(By.css('.mat-option'));
        expect(options.length).toBe(1, 'only one option should be shown');
        expect(component.tokenFc.value).toBe('TS');

        const option = options[0].nativeElement as HTMLElement;
        option.click();
        component.validate(component.tokenFc);
        tick();
        fixture.detectChanges();
        expect(component.tokenFc.value).toBe(connectedToken.address);
        expect(valueChange).toBe(1, 'A value change event should be emitted');
        flush();
    }));

    it('should only show connected tokens when only connected is true', () => {
        component.onlyConnectedTokens = true;
        component.filteredOptions$.subscribe(
            value => {
                expect(value.length).toBe(1);
                expect(value[0]).toEqual(connectedToken);
            },
            error => fail(error)
        );
    });
});
