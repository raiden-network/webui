import { TestBed, inject, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TokenPollingService } from './token-polling.service';
import { RaidenService } from './raiden.service';
import { TestProviders } from '../../testing/test-providers';
import Spy = jasmine.Spy;
import { UserToken } from '../models/usertoken';
import { of } from 'rxjs';
import { createToken } from '../../testing/test-data';
import BigNumber from 'bignumber.js';

describe('TokenPollingService', () => {
    let raidenService: RaidenService;
    let tokenSpy: Spy;

    const token = createToken();
    const updatedToken = Object.assign({}, token, {
        balance: new BigNumber(50),
    });

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
        tokenSpy = spyOn(raidenService, 'getTokens').and.returnValues(
            of([token]),
            of([token]),
            of([updatedToken])
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
            const subscription = service.tokens$.subscribe(
                (tokens: UserToken[]) => {
                    expect(tokens).toEqual([token]);
                }
            );
            expect(tokenSpy).toHaveBeenCalledTimes(1);
            expect(tokenSpy).toHaveBeenCalledWith(true);

            const refreshSpy = spyOn(service, 'refresh').and.callThrough();
            tick(5000);
            expect(refreshSpy).toHaveBeenCalledTimes(1);
            expect(tokenSpy).toHaveBeenCalledTimes(2);
            expect(tokenSpy).toHaveBeenCalledWith(true);
            subscription.unsubscribe();
            flush();
        })
    ));

    it('should get updates for a token', inject(
        [TokenPollingService],
        fakeAsync((service: TokenPollingService) => {
            let emittedTimes = 0;
            const subscription = service
                .getTokenUpdates(token.address)
                .subscribe((newToken) => {
                    if (emittedTimes < 2) {
                        expect(newToken).toEqual(token);
                    } else {
                        expect(newToken).toEqual(updatedToken);
                    }
                    emittedTimes++;
                });

            tick(10000);
            subscription.unsubscribe();
            flush();
        })
    ));
});
