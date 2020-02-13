import { TestBed } from '@angular/core/testing';

import { SelectedTokenService } from './selected-token.service';
import { UserToken } from '../models/usertoken';
import BigNumber from 'bignumber.js';

describe('SelectedTokenService', () => {
    let service: SelectedTokenService;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 8,
        balance: new BigNumber(20)
    };

    beforeEach(() => TestBed.configureTestingModule({}));

    beforeEach(() => {
        service = TestBed.get(SelectedTokenService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have undefined as the default value for the token network', () => {
        service.selectedToken$.subscribe(tokenNetwork => {
            expect(tokenNetwork).toBe(undefined);
        });
    });

    it('should be possible to set and retrieve the token network', () => {
        service.setToken(token);
        service.selectedToken$.subscribe(tokenNetwork => {
            expect(tokenNetwork).toEqual(token);
        });
    });
});
