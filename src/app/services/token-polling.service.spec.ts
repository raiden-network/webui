import { TestBed, inject, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TokenPollingService } from './token-polling.service';
import { RaidenService } from './raiden.service';
import { TestProviders } from '../../testing/test-providers';
import Spy = jasmine.Spy;
import { UserToken } from '../models/usertoken';
import BigNumber from 'bignumber.js';
import { of } from 'rxjs';

describe('TokenPollingService', () => {
    let raidenService: RaidenService;
    let tokenSpy: Spy;

    const token: UserToken = {
        address: '0x0f114A1E9Db192502E7856309cc899952b3db1ED',
        symbol: 'TST',
        name: 'Test Suite Token',
        decimals: 18,
        balance: new BigNumber(20),
    };

    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                TokenPollingService,
                RaidenService,
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
            ],
        })
    );

    beforeEach(() => {
        raidenService = TestBed.inject(RaidenService);
        tokenSpy = spyOn(raidenService, 'getTokens').and.returnValue(
            of([token])
        );
    });

    it('should be created', inject(
        [TokenPollingService],
        (service: TokenPollingService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should refresh the tokens every polling interval', inject(
        [TokenPollingService],
        fakeAsync((service: TokenPollingService) => {
            const sub = service.tokens$.subscribe((tokens: UserToken[]) => {
                expect(tokens).toEqual([token]);
            });
            expect(tokenSpy).toHaveBeenCalledTimes(1);
            expect(tokenSpy).toHaveBeenCalledWith(true);

            const refreshSpy = spyOn(service, 'refresh').and.callThrough();
            tick(5000);
            expect(refreshSpy).toHaveBeenCalledTimes(1);
            expect(tokenSpy).toHaveBeenCalledTimes(2);
            expect(tokenSpy).toHaveBeenCalledWith(true);
            sub.unsubscribe();
            flush();
        })
    ));
});
