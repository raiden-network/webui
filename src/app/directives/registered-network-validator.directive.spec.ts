import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { FormControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { UserToken } from '../models/usertoken';
import { RaidenService } from '../services/raiden.service';
import { RegisteredNetworkValidatorDirective } from './registered-network-validator.directive';
import { TestProviders } from '../../testing/test-providers';
import BigNumber from 'bignumber.js';

describe('RegisteredNetworkValidatorDirective', () => {
    let directive: RegisteredNetworkValidatorDirective;

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
            providers: [TestProviders.MockRaidenConfigProvider()],
            imports: [HttpClientTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        const object = TestBed.get(RaidenService);
        spyOn(object, 'getTokens').and.returnValue(of(tokens));
        directive = new RegisteredNetworkValidatorDirective(object);
    });

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('should return null if the token is in the registered tokens', fakeAsync(() => {
        const control: FormControl = new FormControl(
            '0xeB7f4BBAa1714F3E5a12fF8B681908D7b98BD195'
        );
        const validation: Observable<ValidationErrors | null> = directive.validate(
            control
        ) as Observable<ValidationErrors | null>;
        validation.subscribe(value => {
            expect(value).toBe(null);
            flush();
        });

        tick();
    }));

    it('should return a validation error if the token address is not registered', fakeAsync(() => {
        const control: FormControl = new FormControl(
            '0xc778417E063141139Fce010982780140Aa0cD5Ab'
        );
        const validation: Observable<ValidationErrors | null> = directive.validate(
            control
        ) as Observable<ValidationErrors | null>;
        validation.subscribe(value => {
            expect(value['nonRegistered']).toBe(true);
            flush();
        });

        tick();
    }));
});
